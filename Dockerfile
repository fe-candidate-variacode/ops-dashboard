# syntax=docker/dockerfile:1

# --- deps: install with a cacheable layer keyed on the lockfile only
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

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
