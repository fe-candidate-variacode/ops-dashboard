# Architecture

A real-time operations dashboard for a fleet of nodes streaming high-frequency telemetry.
This document explains how the app is organised, why, and what was deliberately left out.

## 1. Goals and constraints

- **Render cost proportional to what changed.** Coalesced updates, granular selectors and
  memoised rows keep a constant stream from becoming a render storm.
- **A responsive UI under load.** One store write per flush; filtering and sorting render at lower
  priority than input.
- **Logic testable without a browser.** Filtering, sorting, aggregation and chart geometry are
  pure functions.
- **One command runs everything.** `docker compose up`, an nginx proxy, no hardcoded hosts.

Time-boxed take-home: every phase left the app working, and what did not fit is listed in
[section 8](#8-trade-offs-and-known-gaps) rather than hidden.

## 2. System overview

```
mock-server (ws) ──► TelemetryClient        reconnect with exponential backoff, parses + validates
                     └─► UpdateBuffer       Map<nodeId, metric>, latest value wins, snapshot replaces
                         └─► FlushScheduler setTimeout + requestAnimationFrame, max ~4 flushes/s
                             └─► Zustand store   exactly one `set` per flush
                                 └─► granular selectors ──► React components
```

- The WebSocket, the buffer and the scheduler live **outside React** (`startTelemetry.ts`).
  React only reads the store. The pipeline is started once in `main.tsx`.
- The browser always connects to a same-origin `/ws`. nginx (Docker) and the Vite dev server
  both proxy it to the mock server, so there is no CORS and no host configuration.

## 3. Folder layout

```
src/
├── app/            App shell: layout and wiring between features
├── design-system/  tokens.css + Card, Badge, Button, Select, Stat, Table primitives
├── features/
│   ├── telemetry/  domain types, protocol, client, buffer, scheduler, store, selectors
│   ├── overview/   fleet summary counters
│   ├── nodes/      table, status filter, sorting, view state
│   └── node-detail/ detail panel and live SVG chart
└── lib/            pure utilities: ring buffer, backoff, chart geometry, formatters
```

Dependency rule: `design-system` and `lib` depend on nothing in `features`. Features do not
import each other's internals; `app` composes them (selection is owned by the shell and passed
down as props). `telemetry` is the only shared domain module.

## 4. State strategy

Two stores with different lifetimes and update rates:

| Store            | Holds                                                                       | Updates       |
| ---------------- | --------------------------------------------------------------------------- | ------------- |
| `telemetryStore` | `nodesById`, `history` (ring buffer per node), connection status, updates/s | ~4 times/s    |
| `nodesViewStore` | status filter and sort order                                                | on user input |

Selected node is plain `useState` in the shell. Keeping UI state apart from telemetry means a
filter change never waits on, or triggers, work in the stream path.

### How a flush stays cheap

1. Incoming messages are parsed and pushed into `UpdateBuffer`; this is a `Map` write, no React.
2. The scheduler fires at most every 250 ms, aligned to a frame. A hidden tab pauses
   `requestAnimationFrame`, so no rendering work happens at all while the buffer keeps
   coalescing (its size is bounded by node count, not message rate).
3. `applyBatch` builds the next `nodesById` and `history` and calls `set` **once**. Nodes that
   did not change keep their object reference.
4. Components subscribe with narrow selectors:
   - `Overview` uses `useShallow` over computed aggregates, so it only re-renders when a number changes.
   - `NodeRow` is `memo`-ised on the node object, so only rows with new data re-render.
   - `NodeDetail` selects `nodesById[id]` and `history[id]`, so updates to other nodes do not touch it.
5. In `NodesPanel`, filter and sort are passed through `useDeferredValue`: the controls update
   immediately and the table follows at lower priority.

A test (`startTelemetry.test.tsx`) pins the main property: 51 messages produce one render of a
subscribed component, not 51.

### Protocol

JSON frames: `{ type: "snapshot" | "update", nodes: NodeMetric[] }`. A snapshot is sent on
connect (and therefore on every reconnect) and _replaces_ local state, which makes recovery
after a drop trivial: no replay, no gap detection. Malformed frames are ignored; malformed
node entries are dropped without discarding the rest of the frame.

## 5. Mock server

`mock-server/simulation.js` is a pure, seeded simulation (no I/O), so it is unit-tested and
deterministic. `server.js` only adds transport and a tick timer.

- Each node follows a profile (healthy, degraded, unstable) and drifts toward its target with noise
  and occasional spikes. Status is derived from cpu / memory / latency thresholds.
- Three nodes are pinned to a critical profile so E2E tests can always rely on critical rows.
- Configuration: `PORT`, `NODE_COUNT`, `TICK_MS`, `SEED`.

## 6. Accessibility

- Status is conveyed by icon **and** text, never colour alone. All colour pairs were checked
  numerically for WCAG AA contrast (4.8:1 or better on the surfaces used).
- Semantic `<table>` with `<caption>`, `th scope`, `aria-sort`; sort controls are real buttons.
- Row selection is a real `<button>` per row (`aria-expanded`, `aria-controls`); the hit area is
  stretched over the row with CSS, so the mouse gets a full-row target and the keyboard gets one tab stop.
- Charts expose a text alternative: `role="img"` with an `aria-label` that summarises
  current, minimum and maximum values.
- Controls have visible labels; focus is always visible.
- Nothing is announced live on every update. The stream never writes to an `aria-live` region.
- The interface has no animations or transitions, so `prefers-reduced-motion` has nothing to reduce.

Linting enforces part of this with `eslint-plugin-jsx-a11y`; E2E tests locate everything by
role and accessible name, which doubles as a check that the roles exist.

## 7. Testing

| Layer      | Tool                                        | What it covers                                                                                                    |
| ---------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest                                      | ring buffer, backoff, protocol, buffer, scheduler, store, filter/sort/aggregates, chart geometry, mock simulation |
| Component  | Vitest + React Testing Library + user-event | filtering, sorting, selection by mouse and keyboard, live updates, accessible names                               |
| End to end | Cypress in Docker                           | connect, filter to critical, open a critical node's detail, chart advancing live                                  |

Vitest exposes a Jest-compatible API (`describe`, `it`, `expect`, `vi` mirrors `jest`), so
tests read the same as Jest tests; it was chosen because it shares Vite's transform pipeline
and needs no extra configuration.

Component tests assert on what a user perceives (roles, names, visible text), not on
implementation. Time-dependent code (backoff, flush scheduling) is driven with injected clocks
and fake timers rather than real waits. E2E uses `retries: 0` on purpose so flakiness is visible.

## 8. Trade-offs and known gaps

Done differently than ideal, or not done, because of the time box.

**Not implemented (planned improvements):**

- **Pause / resume the stream.** Auto-updating content that lasts more than five seconds should be
  pausable (WCAG 2.2.2). This is the most important accessibility gap. It would also remove
  row jumping while sorted by a live metric. The store would gain an `isPaused` flag that makes
  the scheduler skip `applyBatch` while the buffer keeps coalescing.
- **`aria-live` summary of new critical alerts**, throttled, plus a brief visual highlight.
- **Table virtualisation** (`@tanstack/react-virtual`) and a 2 000-node stress test. At 200 nodes
  a flush occasionally produces a ~50 ms task; this is the first thing to fix for larger fleets.
- **Light theme and `prefers-color-scheme`.** Tokens make this a small change, but only a dark
  theme ships.
- **Parsing and aggregation in a Web Worker.**

**Conscious simplifications:**

- _Immutable ring buffer._ Each push copies up to 60 items. This gives reference-equality selectors
  with no version counters. At much larger scale a mutable ring plus a version number is better.
- _History is sampled at flush rate_ (~4 points/s, 60 points ≈ 15 s), not per message. It bounds
  memory and CPU; fine resolution is lost, and a hidden tab leaves gaps.
- _Status thresholds live only on the server._ The client trusts `status` and does not draw
  threshold lines on charts, avoiding two sources of truth.
- _Rows re-order live_ when sorted by a metric. Ties break by node id, which keeps order stable
  between equal values, but moving values still move rows.
- _Selected node is not in the URL_, so it is not shareable or restored on reload.
- _ESLint 10 with an npm `overrides` entry._ `eslint-plugin-jsx-a11y` does not declare ESLint 10 in
  its peer range. The override makes it resolve against ESLint 10; the project lints cleanly and
  the plugin's rules fire (verified), but this is outside what the plugin officially supports.
- _Cypress needs its binary._ Locally it must be installed with `npx cypress install` (npm 12 blocks
  the postinstall); the supported path is the Docker service, whose image ships the binary and is
  version-checked against `package.json` at build time.
- _No authentication, TLS or backpressure signalling_ between server and client.

## 9. Scaling to 10 000+ nodes

What changes first, roughly in order of payoff:

1. **Do not send what is not seen.** Subscribe per viewport: the client tells the server which node
   ids are visible (plus the selected one), and the server streams only those. Fleet-wide
   aggregates come from the server as a separate low-rate message instead of being recomputed
   from every node on the client.
2. **Aggregate and compress on the backend.** Server-side rollups, delta encoding (send changed
   fields only, not whole records) and per-connection rate limiting; coalesce on the server so
   slow clients get the latest state, not a queue.
3. **Binary protocol.** MessagePack or a schema'd format such as Protobuf/FlatBuffers instead of
   JSON, with typed arrays for metric columns.
4. **Virtualise the table** so DOM size is constant regardless of fleet size.
5. **Move parsing and aggregation off the main thread** into a Web Worker, posting only
   already-batched, structured-cloneable (or transferable) results.
6. **Canvas or WebGL for charts** once there are many simultaneous live series; SVG is fine for one
   or two.
7. **Server-side pagination and filtering of alerts**, so the critical list is a query, not a
   client-side scan of the whole fleet.
8. **Mutable history storage** (typed-array ring buffers with a version counter) to remove
   per-flush allocations.

None of these require changing the dependency direction: the pipeline already isolates transport,
buffering, store and views, so each can be swapped independently.
