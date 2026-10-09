/**
 * Playwright configuration — the single place that controls HOW tests run.
 *
 * Tests describe WHAT to check. This file decides:
 *   - where the tests live
 *   - which URL they open
 *   - which browsers / devices they run on
 *   - what evidence (screenshots, video, trace) goes into the report
 *   - how the site under test is started before the run
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Port for the local web server that serves the portfolio site.
const PORT = 4174;

// Base URL of the site under test. Tests call page.goto('/') and Playwright
// prepends this value, so no test ever hardcodes a full URL.
// Override to test a deployed copy: BASE_URL=https://example.com npm test
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

// Folder with the static portfolio site (index.html, css, js, assets).
// It lives in this repo, so the tests and the site they check always match.
const SITE_DIR = path.resolve(__dirname, 'site');

// `CI` is set automatically by CI systems (GitHub Actions, GitLab, etc.).
// It lets the same config behave stricter on CI than on a laptop.
const isCI = !!process.env.CI;

export default defineConfig({
  // Folder where Playwright looks for *.spec.ts files.
  testDir: './tests',

  // Run tests in parallel, even tests inside the same file.
  // Safe here because every test opens its own fresh browser page.
  fullyParallel: true,

  // On CI, fail the run if someone left `test.only` in the code by mistake
  // (otherwise CI would silently run just one test).
  forbidOnly: isCI,

  // Retry failed tests on CI only. Locally a failure should be seen at once.
  retries: isCI ? 2 : 0,

  // Number of parallel workers. One worker on CI keeps runs predictable;
  // locally Playwright picks a number based on CPU cores.
  workers: isCI ? 1 : undefined,

  // Reporters: `list` prints results in the terminal,
  // our own summary reporter writes test-report/index.html:
  // summary, metrics, coverage, every test with its screenshot, defects.
  reporter: [
    ['list'],
    [
      './reporters/summary-reporter.ts',
      { outputFile: 'test-report/index.html', title: 'Lena Grines — QA Portfolio' },
    ],
  ],

  // Timeouts are Playwright defaults: 30 s per test, 5 s per expect(...).
  // Assertions auto-wait up to that limit, so no manual sleeps are needed.

  // Settings shared by every test in every project.
  use: {
    baseURL: BASE_URL,

    // Trace = step-by-step recording (DOM, network, console) for debugging.
    // Recorded only when a test is retried after a failure.
    trace: 'on-first-retry',

    // A screenshot of every test that opens a page goes into the report,
    // so a reader sees what each test checked. Video only for failed tests.
    screenshot: 'on',
    video: 'retain-on-failure',
  },

  // Start the site before the tests and stop it after.
  // Python's built-in static server is enough for plain HTML/CSS/JS.
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    cwd: SITE_DIR,
    // Playwright waits until this URL responds before starting tests.
    url: BASE_URL,
    // Locally, reuse a server that is already running on the port.
    // On CI, always start a clean one.
    reuseExistingServer: !isCI,
    // Python logs every request ("GET /css/styles.css 200") to stderr.
    // Hide it so the terminal shows only test results.
    stderr: 'ignore',
  },

  // Projects = groups of tests with their own browser / device / site settings.
  projects: [
    {
      // Desktop Chrome (1280x720): all portfolio specs except the mobile one.
      // saucedemo-login.spec.ts and *-api.spec.ts test other sites, so they are excluded too.
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/mobile-menu\.spec\.ts/, /saucedemo-login\.spec\.ts/, /-api\.spec\.ts/],
    },
    {
      // Emulated Pixel 7 phone (412px wide, touch, mobile user agent).
      // The site switches to the hamburger menu below 860px,
      // so only the mobile menu spec runs here.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile-menu\.spec\.ts/,
    },
    {
      // Login tests against Sauce Demo, a public practice shop.
      // A project can override `use` settings, so this one points to
      // another site while the portfolio projects keep the local one.
      name: 'login',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        // Sauce Demo marks elements with data-test="..." instead of
        // Playwright's default data-testid, so getByTestId reads data-test.
        testIdAttribute: 'data-test',
      },
      testMatch: /saucedemo-login\.spec\.ts/,
    },
    {
      // API tests against JSONPlaceholder, a public practice REST API.
      // They use only the `request` client, so no browser is opened.
      // Every file named *-api.spec.ts (e.g. posts-api.spec.ts) runs here.
      name: 'api',
      use: { baseURL: 'https://jsonplaceholder.typicode.com' },
      testMatch: /-api\.spec\.ts/,
    },
  ],
});
