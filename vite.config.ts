/// <reference types="node" />
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app always connects to a same-origin /ws. In dev, Vite proxies it to the mock
// server so no host is hardcoded; in the production image nginx plays the same role
// (see nginx.conf). Inside docker compose the target is the `mock-server` service.
const wsProxyTarget = process.env.WS_PROXY_TARGET ?? 'ws://localhost:8081';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': { target: wsProxyTarget, ws: true },
    },
    // Native file events are used by default; polling is an opt-in for bind mounts
    // that do not deliver them.
    watch: process.env.VITE_USE_POLLING ? { usePolling: true } : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'mock-server/**/*.test.js'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
