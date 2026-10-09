import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build (`next build && next start`) wired to
 * the LOCAL Supabase stack. They only ever create rounds flagged as rehearsal.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1, // all tests share the single active round
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "mk-MK", // guests' phones default to the device language; tests use Macedonian
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${BASE_URL}/api/state`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { PUBLIC_SITE_URL: BASE_URL, VOTE_RATE_LIMIT_PER_MINUTE: "5000" },
  },
});
