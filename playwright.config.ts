import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './scripts/qa',
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx next dev --port 3000',
        url: 'http://127.0.0.1:3000/auth',
        timeout: 240_000,
        reuseExistingServer: true,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
