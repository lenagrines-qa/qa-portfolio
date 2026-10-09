import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object for the portfolio home page (the site has only one page).
 *
 * Page Object Model (POM):
 *   - All selectors for a page live in ONE class.
 *   - Tests use readable names (homePage.emailCta) instead of raw selectors.
 *   - If the HTML changes, only this file is updated, not every test.
 *
 * Selector strategy:
 *   - Prefer getByRole(...) with the accessible name — it finds elements the
 *     way a user (or a screen reader) sees them, and survives CSS refactors.
 *   - Use CSS / id locators only when an element has no useful role or name.
 */
export class HomePage {
  // Playwright Page = one browser tab. Exposed so tests can make
  // one-off checks that do not deserve a dedicated locator.
  readonly page: Page;

  // --- Header ---
  readonly brand: Locator; // Logo + "lena.grines" text, top left
  readonly menuButton: Locator; // Hamburger button, visible only on mobile
  readonly nav: Locator; // Main navigation (About, Tools, Experience...)

  // --- Hero (first screen) ---
  readonly heroTitle: Locator; // <h1>Lena Grines</h1>
  readonly role: Locator; // "Senior QA Engineer" under the name
  readonly emailCta: Locator; // "Email the QA lead" button
  readonly resumeLink: Locator; // "Download resume" button

  // --- Smoke widget (animated "test report" box in the hero) ---
  readonly smokeStatus: Locator; // Status line under the checklist
  readonly smokeReport: Locator; // Whole widget; gets class "passed" at the end
  readonly smokePassedChecks: Locator; // Checklist rows marked as passed

  // --- Contact section ---
  readonly emailLink: Locator; // Email address link
  readonly phoneLink: Locator; // Phone number link
  readonly copyEmailButton: Locator; // "Copy email" button
  readonly copyStatus: Locator; // Message shown after copying

  /**
   * The constructor only DEFINES locators — it does not touch the browser.
   * A Locator is a lazy "recipe" for finding an element; Playwright looks
   * the element up each time an action or assertion uses it.
   */
  constructor(page: Page) {
    this.page = page;

    // Header
    this.brand = page.locator('.brand');
    this.menuButton = page.getByRole('button', { name: 'Menu' });
    this.nav = page.getByRole('navigation', { name: 'Primary' });

    // Hero
    this.heroTitle = page.getByRole('heading', { level: 1, name: 'Lena Grines' });
    this.role = page.locator('.role');
    this.emailCta = page.getByRole('link', { name: 'Email the QA lead' });
    this.resumeLink = page.getByRole('link', { name: 'Download resume' });

    // Smoke widget
    this.smokeStatus = page.locator('#report-status');
    this.smokeReport = page.locator('.report');
    this.smokePassedChecks = page.locator('#checks li.ok');

    // Contact
    this.emailLink = page.getByRole('link', { name: 'lenagrines.qa@gmail.com' });
    this.phoneLink = page.getByRole('link', { name: '786-941-8197' });
    this.copyEmailButton = page.getByRole('button', { name: 'Copy email' });
    this.copyStatus = page.locator('#copy-status');
  }

  /** Opens the home page. '/' is resolved against baseURL from the config. */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Returns a link inside the main navigation by its visible text. */
  navLink(name: string): Locator {
    return this.nav.getByRole('link', { name });
  }

  /** Returns a page section by its HTML id (e.g. 'about' → <section id="about">). */
  section(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  /**
   * Opens the mobile hamburger menu and confirms it really opened.
   * Checks are built into the action so every test that uses it
   * fails at the right step if the menu is broken.
   */
  async openMobileMenu(): Promise<void> {
    await expect(this.menuButton).toBeVisible();
    await this.menuButton.click();
    // aria-expanded tells screen readers the menu state.
    await expect(this.menuButton).toHaveAttribute('aria-expanded', 'true');
    // The site shows the mobile menu by adding the CSS class "open".
    await expect(this.nav).toHaveClass(/open/);
  }

  /**
   * Clicks a navigation link and confirms the page landed on its section:
   *   1. the URL ends with #sectionId (e.g. .../#about)
   *   2. that section is visible in the browser window
   */
  async goToSection(linkName: string, sectionId: string): Promise<void> {
    await this.navLink(linkName).click();
    await expect(this.page).toHaveURL(new RegExp(`#${sectionId}$`));
    await expect(this.section(sectionId)).toBeInViewport();
  }
}
