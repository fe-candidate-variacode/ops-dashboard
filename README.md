# Fleet Operations Dashboard

Real-time monitoring dashboard for a fleet of nodes streaming high-frequency telemetry.

## Requirements

- Docker with Compose v2 (for the containerized run)
- Node.js 24 LTS (see `.nvmrc`) for local development

## Run with Docker

```bash
docker compose up --build
```

Open http://localhost:3000.

## Local development

```bash
npm ci
npm --prefix mock-server ci
npm --prefix mock-server start   # mock WebSocket server on :8081
npm run dev                      # Vite on :5173, proxies /ws to :8081
```

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm test`             | Unit and component tests |
| `npm run lint`         | ESLint (incl. jsx-a11y)  |
| `npm run typecheck`    | TypeScript strict check  |
| `npm run format:check` | Prettier check           |
| `npm run build`        | Type-check and bundle    |
