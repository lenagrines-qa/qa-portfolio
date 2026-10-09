/**
 * TC-06 Site health — negative checks: broken pages, files, and scripts.
 *
 * Happy-path tests prove features work. These tests look for what is broken
 * but not visible at first glance: a missing file, a JavaScript error,
 * a server that answers "OK" to pages that do not exist.
 */
import { HomePage } from '../pages/HomePage';
import { test, expect } from '../fixtures/test';

test.describe('TC-06 Site health', () => {
  // TC-06: a page that does not exist returns 404, not 200 with an empty page.
  // `request` sends a plain HTTP request without opening a browser.
  test('unknown page returns 404', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist.html');
    expect(response.status()).toBe(404);
  });

  // TC-06b: every file the page loads from its own server (CSS, JS, images)
  // answers successfully.
  // This test uses the built-in `page` fixture instead of `homePage`,
  // because the listener must be attached BEFORE the page starts loading.
  test('all site files (CSS, JS, images) load without errors', async ({ page, baseURL }) => {
    const broken: string[] = [];

    // Fires for every response the browser receives.
    page.on('response', (response) => {
      // Ignore third-party files (Google Fonts): they are outside our control
      // and may be unavailable on an offline CI machine.
      const isOwnFile = response.url().startsWith(baseURL!);
      if (isOwnFile && response.status() >= 400) {
        broken.push(`${response.status()} ${response.url()}`);
      }
    });

    // Fires when a request gets no response at all (e.g. connection refused).
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(baseURL!)) {
        broken.push(`FAILED ${request.url()}`);
      }
    });

    // goto() resolves after the browser "load" event: all files are requested.
    await new HomePage(page).goto();

    // An empty list means nothing is broken; otherwise the report shows
    // exactly which files failed.
    expect(broken).toEqual([]);
  });

  // TC-06c: the page loads without JavaScript errors.
  // A script error can silently break the menu, the copy button, or the widget.
  test('home page loads without JavaScript errors', async ({ page, baseURL }) => {
    const errors: string[] = [];

    // Uncaught exceptions thrown by the site's scripts.
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    // Errors printed to the browser console by our own files.
    page.on('console', (message) => {
      const fromOwnFile = message.location().url.startsWith(baseURL!);
      if (message.type() === 'error' && fromOwnFile) {
        errors.push(`console: ${message.text()}`);
      }
    });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Let the site's script finish its work (the smoke widget animation)
    // before checking, so late errors are caught too.
    await expect(homePage.smokeReport).toHaveClass(/passed/);

    expect(errors).toEqual([]);
  });
});
