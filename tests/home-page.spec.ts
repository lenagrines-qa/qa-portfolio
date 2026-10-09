/**
 * TC-01 Home page — fastest (smoke) check that the site is up and shows the right person.
 *
 * Tagged @smoke: run only smoke tests with `npm run test:smoke`.
 * If these fail, there is no point running the rest of the suite.
 */

// `test` and `expect` come from our fixtures file, so `homePage` is available.
import { test, expect } from '../fixtures/test';

// `describe` groups related tests; its title appears in every report line.
test.describe('TC-01 Home page @smoke', () => {
  // TC-01: the first screen shows the correct identity and working CTA links.
  // `homePage` arrives already opened on '/' (see fixtures/test.ts).
  test('first screen shows name, role, email and resume buttons', async ({ homePage, page }) => {
    // Browser tab title contains the name (what recruiters see in the tab / Google).
    await expect(page).toHaveTitle(/Lena Grines/);

    // Main heading with the name is visible on the first screen.
    await expect(homePage.heroTitle).toBeVisible();

    // Job title matches the resume exactly.
    await expect(homePage.role).toHaveText('Senior QA Engineer');

    // "Email the QA lead" opens the mail app with the right address.
    // We check the href attribute instead of clicking: clicking a mailto:
    // link would try to open an external mail program.
    await expect(homePage.emailCta).toHaveAttribute(
      'href',
      'mailto:lenagrines.qa@gmail.com',
    );

    // "Download resume" points to the PDF that ships with the site.
    // (TC-03c in contact.spec.ts checks that the file really downloads.)
    await expect(homePage.resumeLink).toHaveAttribute(
      'href',
      'assets/Lena_Grines.pdf',
    );

    // Logo text in the header is rendered.
    await expect(homePage.brand).toContainText('lena.grines');
  });

  // TC-01b: the animated "smoke test" widget in the hero ends in a green state.
  // On page load the site marks 5 checklist rows as passed one by one
  // (about 1.5 s in total), then shows the final status text.
  test('smoke test widget on the page ends with 5 / 5 passed', async ({ homePage }) => {
    // toHaveText keeps retrying until the text matches (up to expect timeout),
    // so the test waits for the animation without any manual sleep.
    await expect(homePage.smokeStatus).toHaveText(
      '5 / 5 passed. Ship it. (Then test production anyway.)',
    );

    // The widget switches to its "passed" (green) style.
    await expect(homePage.smokeReport).toHaveClass(/passed/);

    // All 5 checklist rows are marked as passed — not 4, not 6.
    await expect(homePage.smokePassedChecks).toHaveCount(5);
  });
});
