import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run dev -w server',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev -w client',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
