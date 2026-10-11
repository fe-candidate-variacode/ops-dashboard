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

## End-to-end tests

Cypress specs live in `cypress/e2e`. They run inside Docker against the production build
served by nginx, using the official `cypress/included` image:

```bash
docker compose --profile e2e up --build --abort-on-container-exit --exit-code-from cypress
```

The command exits with the Cypress exit code. The image tag (`CYPRESS_VERSION` in
`docker-compose.yml`) must match the `cypress` version pinned in `package.json`; the build
fails with a clear message if they drift.

## Local development

```bash
npm ci
npm --prefix mock-server ci
npm --prefix mock-server start   # mock WebSocket server on :8081
npm run dev                      # Vite on :5173, proxies /ws to :8081
```

## Scripts

| Command                | Description                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm test`             | Unit and component tests                                                                                             |
| `npm run lint`         | ESLint (incl. jsx-a11y)                                                                                              |
| `npm run typecheck`    | TypeScript strict check (app and Cypress)                                                                            |
| `npm run format:check` | Prettier check                                                                                                       |
| `npm run build`        | Type-check and bundle                                                                                                |
| `npm run e2e`          | Cypress against `localhost:3000` (run `docker compose up` first; needs the Cypress binary via `npx cypress install`) |
