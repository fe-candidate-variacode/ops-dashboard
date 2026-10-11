import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { createSimulation } from './simulation.js';

function intFromEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const PORT = intFromEnv('PORT', 8081);
const NODE_COUNT = intFromEnv('NODE_COUNT', 200);
const TICK_MS = intFromEnv('TICK_MS', 100);
const SEED = intFromEnv('SEED', 20240611);

const simulation = createSimulation({ nodeCount: NODE_COUNT, seed: SEED });

// Plain HTTP endpoint used by the container healthcheck.
const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'snapshot', nodes: simulation.snapshot() }));
});

const ticker = setInterval(() => {
  const nodes = simulation.tick();
  if (nodes.length === 0) return;
  const payload = JSON.stringify({ type: 'update', nodes });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}, TICK_MS);

server.listen(PORT, () => {
  console.log(
    `mock-server listening on :${PORT} (nodes=${NODE_COUNT}, tick=${TICK_MS}ms, seed=${SEED})`,
  );
});

function shutdown() {
  clearInterval(ticker);
  wss.close();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
