import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8081);

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
  socket.send(JSON.stringify({ type: 'hello', message: 'mock server connected' }));
});

server.listen(PORT, () => {
  console.log(`mock-server listening on :${PORT}`);
});
