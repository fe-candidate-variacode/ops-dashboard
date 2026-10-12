# syntax=docker/dockerfile:1
#
# Multi-stage build. Targets:
#   runtime (default, last stage)  production image: nginx serving the built SPA
#   dev                            Vite dev server with HMR
#   test                           runs the unit and component tests
# Stages only build when they are needed by the requested target.

# --- deps: install with a cacheable layer keyed on the lockfile only
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- dev: Vite dev server; compose bind-mounts the sources for hot reload
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- test: self-contained unit and component test run (no local node_modules needed)
FROM deps AS test
COPY . .
CMD ["npm", "test"]

# --- build: type-check and produce the static bundle
FROM deps AS build
COPY . .
RUN npm run build

# --- runtime: nginx serves the SPA and proxies /ws to the mock server
FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
