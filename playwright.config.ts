import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const PREVIEW = `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  // The suite stubs every /api call, so the preview server alone is enough —
  // no Worker, no upstream holiday providers, no flake from either.
  // `--host 127.0.0.1` pins the socket to the loopback address the tests poll;
  // left to its default the server binds whatever `localhost` resolves to, which
  // is not always the same family. CI builds in its own step, so the timeout
  // below covers only the preview server coming up.
  webServer: {
    command: process.env.CI ? PREVIEW : `npm run build && ${PREVIEW}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
