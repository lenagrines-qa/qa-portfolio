/**
 * TC-07 Sauce Demo login — login form of Sauce Demo (https://www.saucedemo.com).
 *
 * Sauce Demo is a public practice web shop built for test automation.
 * It is used here because a personal portfolio has no login, and login
 * (valid / invalid / locked / empty fields) is a core QA scenario.
 *
 * Runs only in the `login` project (see playwright.config.ts), whose baseURL
 * is https://www.saucedemo.com. Needs internet access.
 */
import { test, expect } from '../fixtures/test';

// Public demo credentials: Sauce Demo prints them on its own login page,
// so they are not secrets and are safe to keep in the code.
const PASSWORD = 'secret_sauce';

test.describe('TC-07 Sauce Demo login', () => {
  // TC-07: a valid user logs in and lands on the product catalog.
  test('valid user logs in and sees the product catalog', async ({ loginPage, page }) => {
    await loginPage.login('standard_user', PASSWORD);

    // The URL changed to the catalog page.
    await expect(page).toHaveURL(/\/inventory\.html$/);

    // The catalog title is shown — a stronger check than the URL alone,
    // because it proves the page actually rendered.
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  // TC-07b..e: data-driven negative tests.
  // One table of inputs and expected errors → one generated test per row.
  // Adding a new negative case means adding one line, not a new test.
  const invalidLogins = [
    {
      id: 'TC-07b',
      name: 'wrong password',
      username: 'standard_user',
      password: 'wrong_password',
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    {
      id: 'TC-07c',
      name: 'locked out user',
      username: 'locked_out_user',
      password: PASSWORD,
      error: 'Epic sadface: Sorry, this user has been locked out.',
    },
    {
      id: 'TC-07d',
      name: 'empty username',
      username: '',
      password: PASSWORD,
      error: 'Epic sadface: Username is required',
    },
    {
      id: 'TC-07e',
      name: 'empty password',
      username: 'standard_user',
      password: '',
      error: 'Epic sadface: Password is required',
    },
  ];

  for (const data of invalidLogins) {
    // Test title includes the TC id and the case, e.g.
    // "TC-07b: wrong password shows an error and stays on login".
    test(`${data.id}: ${data.name} shows an error and stays on login`, async ({
      loginPage,
      page,
    }) => {
      await loginPage.login(data.username, data.password);

      // The exact error text for this case is shown.
      await expect(loginPage.errorMessage).toHaveText(data.error);

      // The user was NOT let in: still on the login page, button still there.
      await expect(page).not.toHaveURL(/inventory/);
      await expect(loginPage.loginButton).toBeVisible();
    });
  }
});
