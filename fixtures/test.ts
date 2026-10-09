/**
 * Custom fixtures — shared setup that tests receive as arguments.
 *
 * Playwright already provides built-in fixtures such as `page`, `context`
 * and `request`. Here we add our own: `homePage` and `loginPage`.
 *
 * Without this file every test would start with the same two lines:
 *     const homePage = new HomePage(page);
 *     await homePage.goto();
 * With it, a test just asks for `homePage` and gets an opened page:
 *     test('...', async ({ homePage }) => { ... });
 *
 * A fixture runs only when a test asks for it, so portfolio tests never
 * open Sauce Demo and login tests never open the portfolio.
 *
 * Specs import `test` and `expect` from THIS file, not from '@playwright/test'.
 */
import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

// Describes the fixtures we add, so TypeScript knows their types.
type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
};

// `base.extend` creates a new `test` function that has all built-in
// fixtures plus ours.
export const test = base.extend<Fixtures>({
  // Portfolio home page, already opened.
  homePage: async ({ page }, use) => {
    // Setup: runs before the test body.
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hand the ready object to the test. The test body runs inside `use`.
    await use(homePage);

    // Teardown would go after `use` (nothing needed: Playwright closes the page).
  },

  // Sauce Demo login page, already opened.
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});

// Re-export `expect` so specs need only one import line.
export { expect } from '@playwright/test';
