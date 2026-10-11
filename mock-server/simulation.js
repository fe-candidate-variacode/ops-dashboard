// Pure fleet simulation: no I/O, no timers. The server wires it to a WebSocket;
// tests drive it directly. Everything random comes from a seeded PRNG so a given
// (seed, nodeCount) always produces the same stream.

export const THRESHOLDS = {
  warning: { cpu: 70, memory: 75, latencyMs: 250 },
  critical: { cpu: 90, memory: 92, latencyMs: 600 },
};

export function deriveStatus({ cpu, memory, latencyMs }) {
  const c = THRESHOLDS.critical;
  if (cpu >= c.cpu || memory >= c.memory || latencyMs >= c.latencyMs) return 'CRITICAL';
  const w = THRESHOLDS.warning;
  if (cpu >= w.cpu || memory >= w.memory || latencyMs >= w.latencyMs) return 'WARNING';
  return 'OK';
}

// mulberry32: tiny, fast, good enough for simulated telemetry.
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value) => Math.round(value * 10) / 10;

// Number of nodes pinned to a permanently critical profile, so E2E tests can
// always rely on CRITICAL rows existing regardless of the random draw.
const PINNED_CRITICAL_NODES = 3;

const PROFILES = {
  healthy: { cpu: [25, 55], memory: [30, 65], latencyMs: [20, 120] },
  degraded: { cpu: [60, 80], memory: [65, 85], latencyMs: [150, 350] },
  unstable: { cpu: [85, 97], memory: [80, 95], latencyMs: [450, 800] },
  pinned: { cpu: [95, 95], memory: [94, 94], latencyMs: [700, 700] },
};

function pickProfile(index, roll) {
  if (index < PINNED_CRITICAL_NODES) return 'pinned';
  if (roll < 0.1) return 'unstable';
  if (roll < 0.3) return 'degraded';
  return 'healthy';
}

function between(rng, [min, max]) {
  return min + rng() * (max - min);
}

function nodeIdFor(index) {
  return `node-${String(index + 1).padStart(3, '0')}`;
}

function toMetric(node, timestamp) {
  const cpu = round1(node.cpu);
  const memory = round1(node.memory);
  const latencyMs = Math.round(node.latencyMs);
  return {
    nodeId: node.nodeId,
    status: deriveStatus({ cpu, memory, latencyMs }),
    cpu,
    memory,
    latencyMs,
    timestamp,
  };
}

/**
 * @param {{ nodeCount: number, seed: number, updateRatio?: number, now?: () => number }} options
 */
export function createSimulation({ nodeCount, seed, updateRatio = 0.25, now = Date.now }) {
  const rng = createRng(seed);

  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const profile = PROFILES[pickProfile(index, rng())];
    const target = {
      cpu: between(rng, profile.cpu),
      memory: between(rng, profile.memory),
      latencyMs: between(rng, profile.latencyMs),
    };
    return { nodeId: nodeIdFor(index), target, ...target };
  });

  function step(node) {
    const { target } = node;
    const spike = rng() < 0.02 ? 25 : 0;
    node.cpu = clamp(node.cpu + (target.cpu - node.cpu) * 0.2 + (rng() - 0.5) * 16 + spike, 0, 100);
    node.memory = clamp(
      node.memory + (target.memory - node.memory) * 0.2 + (rng() - 0.5) * 6,
      0,
      100,
    );
    node.latencyMs = Math.max(
      1,
      node.latencyMs +
        (target.latencyMs - node.latencyMs) * 0.2 +
        (rng() - 0.5) * target.latencyMs * 0.3,
    );
  }

  return {
    /** Current state of every node. Sent to each client on connect. */
    snapshot() {
      const timestamp = now();
      return nodes.map((node) => toMetric(node, timestamp));
    },
    /** Advances the simulation one tick and returns only the nodes that changed. */
    tick() {
      const timestamp = now();
      const changed = [];
      for (const node of nodes) {
        if (rng() >= updateRatio) continue;
        step(node);
        changed.push(toMetric(node, timestamp));
      }
      return changed;
    },
  };
}
