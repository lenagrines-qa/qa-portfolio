/**
 * TC-02 Navigation — header links take the user to the right sections.
 *
 * Runs in the `desktop-chrome` project (see playwright.config.ts), where the
 * navigation links are always visible in the header. The mobile menu has its
 * own test in mobile-menu.spec.ts.
 */
import { test, expect } from '../fixtures/test';

test.describe('TC-02 Navigation', () => {
  // TC-02: every header link scrolls to its section.
  test('header links scroll to the right sections', async ({ homePage }) => {
    // Test data: link text in the header → id of the section it should open.
    // Note the link text and the id are not always the same word
    // ("Tools" → #skills, "Work" → #projects), which is exactly why it's tested.
    // `as const` makes the array read-only and keeps the exact string values.
    const routes = [
      { link: 'About', id: 'about' },
      { link: 'Tools', id: 'skills' },
      { link: 'Experience', id: 'experience' },
      { link: 'Work', id: 'projects' },
      { link: 'Contact', id: 'contact' },
    ] as const;

    // One test walks through all links in order. goToSection() clicks the link
    // and asserts the URL hash and section visibility (see pages/HomePage.ts).
    for (const route of routes) {
      await homePage.goToSection(route.link, route.id);
    }
  });

  // TC-02b: the Experience section shows the current job from the resume.
  test('Experience section shows the current job: Senior QA Engineer at WTS', async ({
    homePage,
  }) => {
    await homePage.goToSection('Experience', 'experience');

    // Each job in the timeline is an <h3> heading "Role · Company".
    // This one-off locator lives in the test, not in the Page Object,
    // because no other test needs it.
    await expect(
      homePage.page.getByRole('heading', {
        level: 3,
        name: 'Senior QA Engineer · WTS',
      }),
    ).toBeVisible();
  });
});
