# Fleet Operations Dashboard

Real-time monitoring dashboard for a fleet of nodes streaming high-frequency telemetry:
fleet overview, a filterable and sortable node table, and a live detail panel with charts.

- Live stream over WebSocket with automatic reconnection (exponential backoff)
- Updates are batched (~4 UI updates per second) so the interface stays responsive
- Accessible by design: status is never conveyed by colour alone, full keyboard support
- Unit, component and end-to-end tests

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions, trade-offs and how this would scale.

## Requirements

- **Docker** with Compose v2 — enough to run the app and the end-to-end tests
- **Node.js 24 LTS** (see `.nvmrc`) — only for local development and unit tests

## Run with Docker

```bash
docker compose up --build
```

`docker-compose up` (hyphenated, as in older installations) works the same way and builds the
images automatically on first run.

Open <http://localhost:3000>. Two containers start: `web` (nginx serving the built app and
proxying `/ws`) and `mock-server` (the simulated fleet). `web` waits for the mock server's
healthcheck.

Stop with `Ctrl+C`, then `docker compose down`.

### Docker environments

One multi-stage `Dockerfile`, selected per service with `target`:

| Command                                                   | Target    | Purpose                         |
| --------------------------------------------------------- | --------- | ------------------------------- |
| `docker compose up --build`                               | `runtime` | Production: nginx on :3000      |
| `docker compose --profile dev up --build`                 | `dev`     | Vite dev server with HMR, :5173 |
| `docker compose --profile test run --build --rm unit`     | `test`    | Unit and component tests        |
| `docker compose --profile e2e up --build ...` (see below) | n/a       | Cypress end-to-end tests        |

### Mock server configuration

Set these in the environment before `docker compose up`:

| Variable     | Default    | Meaning                            |
| ------------ | ---------- | ---------------------------------- |
| `NODE_COUNT` | `200`      | Number of simulated nodes          |
| `TICK_MS`    | `100`      | Simulation tick interval           |
| `SEED`       | `20240611` | PRNG seed (same seed, same stream) |

```bash
NODE_COUNT=2000 docker compose up --build
```

With the default seed at least three nodes are always `CRITICAL`.

## Tests

### Unit and component tests

In Docker, with no local Node or `node_modules` required:

```bash
docker compose --profile test run --build --rm unit
```

Or locally:

```bash
npm ci
npm test
```

Both run Vitest with React Testing Library (including the mock server's simulation tests).

### End-to-end tests

```bash
docker compose --profile e2e up --build --abort-on-container-exit --exit-code-from cypress
```

Cypress runs inside Docker against the production build behind nginx. The command exits with
Cypress's exit code, so it can gate CI. The Cypress image tag in `docker-compose.yml` must match
the `cypress` version pinned in `package.json`; the build fails with a clear message otherwise.

## Development with hot reload (Docker)

```bash
docker compose --profile dev up --build
```

Open <http://localhost:5173>. This runs the Vite dev server in a container with `src/` mounted
from the host, so edits hot-reload, and `/ws` is proxied to the `mock-server` service. If your
Docker setup does not deliver file-change events through the bind mount, enable polling with
`VITE_USE_POLLING=1 docker compose --profile dev up --build`.

## Local development (without Docker)

```bash
npm ci
npm --prefix mock-server ci
npm --prefix mock-server start   # mock WebSocket server on :8081
npm run dev                      # Vite on http://localhost:5173, proxies /ws to :8081
```

Running Cypress outside Docker needs its binary once: `npx cypress install`, then start the
stack (`docker compose up`) and run `npm run e2e`.

## Scripts

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Vite dev server with `/ws` proxy          |
| `npm run build`        | Type-check and bundle                     |
| `npm test`             | Unit and component tests                  |
| `npm run lint`         | ESLint (including jsx-a11y)               |
| `npm run typecheck`    | TypeScript strict check (app and Cypress) |
| `npm run format:check` | Prettier check                            |
| `npm run e2e`          | Cypress against `localhost:3000`          |

## Project structure

```
src/
├── app/            App shell and layout
├── design-system/  tokens and UI primitives
├── features/       telemetry, overview, nodes, node-detail
└── lib/            pure utilities
mock-server/        Node + ws fleet simulation
cypress/            end-to-end specs
```
