import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Overridden with CYPRESS_BASE_URL inside docker compose (http://web).
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    // The app streams ~500 node updates/s; give first paint of data some room.
    defaultCommandTimeout: 8000,
    retries: 0,
  },
});
