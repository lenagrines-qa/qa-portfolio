/**
 * TC-05 Accessibility — the site is usable with a screen reader and a keyboard.
 *
 * Uses axe-core (@axe-core/playwright), the same engine as browser
 * accessibility extensions, to scan the page against WCAG rules.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test';

test.describe('TC-05 Accessibility', () => {
  // TC-05: automated WCAG 2.1 A/AA scan finds no violations.
  test('home page has no WCAG 2.1 A/AA violations', async ({ homePage }) => {
    // Wait for the smoke widget animation to finish, so axe scans the final
    // state of the page (colors and text change when it turns green).
    await expect(homePage.smokeReport).toHaveClass(/passed/);

    // Scan the whole page, limited to WCAG 2.0/2.1 level A and AA rules —
    // the level most accessibility laws and company policies require.
    const results = await new AxeBuilder({ page: homePage.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Keep only what helps to fix a failure: rule id, short help text,
    // and the HTML of the offending elements. Comparing this list with []
    // prints a readable diff in the report when something is wrong.
    const violations = results.violations.map((violation) => ({
      rule: violation.id,
      help: violation.help,
      elements: violation.nodes.map((node) => node.html),
    }));
    expect(violations).toEqual([]);
  });

  // TC-05b: keyboard users can jump over the header straight to the content.
  test('first Tab focuses "Skip to content" and Enter jumps to the main content', async ({
    homePage,
  }) => {
    const skipLink = homePage.page.getByRole('link', { name: 'Skip to content' });

    // The first Tab press on a fresh page focuses the skip link
    // (it is visually hidden until focused).
    await homePage.page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // Enter follows the link: the URL gets #main and the main content is on screen.
    await homePage.page.keyboard.press('Enter');
    await expect(homePage.page).toHaveURL(/#main$/);
    await expect(homePage.page.locator('#main')).toBeInViewport();
  });
});
