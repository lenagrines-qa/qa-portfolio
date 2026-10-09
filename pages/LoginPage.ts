import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the login form of Sauce Demo (https://www.saucedemo.com) —
 * a public practice web shop made for test automation.
 *
 * Same Page Object idea as HomePage: selectors live here, tests use readable
 * names (loginPage.usernameInput) and the login() action.
 *
 * Selector strategy:
 *   - Inputs and the button: getByRole + accessible name, like in HomePage.
 *   - Error message: getByTestId. The site marks it with data-test="error";
 *     the `login` project in playwright.config.ts sets testIdAttribute to
 *     'data-test', so getByTestId('error') finds it.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator; // "Username" text field
  readonly passwordInput: Locator; // "Password" field
  readonly loginButton: Locator; // "Login" button
  readonly errorMessage: Locator; // Red error banner shown after a failed login

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
  }

  /** Opens the login page. '/' is resolved against the login project's baseURL. */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Fills both fields and submits the form.
   * Empty strings are allowed on purpose: negative tests use them
   * to check the "required field" errors.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
