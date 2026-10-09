/**
 * TC-04 Mobile menu — the hamburger menu works on a phone-sized screen.
 *
 * Runs only in the `mobile-chrome` project (emulated Pixel 7, 412px wide).
 * Below 860px the site hides the header links behind a "Menu" button.
 */
import { test, expect } from '../fixtures/test';

test.describe('TC-04 Mobile menu', () => {
  // TC-04: open the menu → tap a link → land on the section → menu closes.
  test('menu opens, navigates to About, then closes', async ({ homePage }) => {
    // Opens the menu and asserts it is open (see openMobileMenu in HomePage).
    await homePage.openMobileMenu();

    // Tap "About" inside the opened menu.
    await homePage.navLink('About').click();

    // The page jumped to the About section.
    await expect(homePage.page).toHaveURL(/#about$/);

    // The menu closed by itself after the tap, so it no longer covers the page:
    // 1. the button reports the closed state to screen readers
    await expect(homePage.menuButton).toHaveAttribute('aria-expanded', 'false');
    // 2. the nav lost the "open" class. A closed mobile nav is display:none,
    //    which hides it from getByRole, so it is located by id here.
    await expect(homePage.page.locator('#nav')).not.toHaveClass(/open/);
  });
});
