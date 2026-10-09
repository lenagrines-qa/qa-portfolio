/**
 * TC-03 Contact and resume — a recruiter can actually reach Lena.
 *
 * Tagged @smoke: broken contact details make the whole portfolio useless.
 * Expected values come from the resume (site/assets/Lena_Grines.pdf).
 */
import { test, expect } from '../fixtures/test';

test.describe('TC-03 Contact and resume @smoke', () => {
  // TC-03: email and phone links in the Contact section match the resume.
  test('email and phone links match the resume', async ({ homePage }) => {
    await homePage.goToSection('Contact', 'contact');

    // mailto: opens the mail app with this address prefilled.
    await expect(homePage.emailLink).toHaveAttribute(
      'href',
      'mailto:lenagrines.qa@gmail.com',
    );

    // tel: starts a call on phones. The link text is 786-941-8197,
    // the href uses the international format +1 7869418197.
    await expect(homePage.phoneLink).toHaveAttribute('href', 'tel:+17869418197');
  });

  // TC-03b: "Copy email" puts the address into the clipboard and confirms it.
  // `context` is the built-in fixture for the browser session (cookies,
  // permissions). `page` is the open tab, used here to read the clipboard.
  test('copy email button puts the address in the clipboard and confirms it', async ({
    homePage,
    page,
    context,
  }) => {
    // Browsers block clipboard access by default; allow it for this test.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await homePage.goToSection('Contact', 'contact');
    await homePage.copyEmailButton.click();

    // The confirmation message appears (it is hidden until the click).
    await expect(homePage.copyStatus).toBeVisible();
    await expect(homePage.copyStatus).toHaveText(
      'Copied. Please do not log this as a P1.',
    );

    // The clipboard really contains the email — the message alone
    // would not prove the copy worked.
    // page.evaluate runs the function inside the browser and returns the result.
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('lenagrines.qa@gmail.com');
  });

  // TC-03c: the resume PDF is served by the site.
  // `request` is the built-in API client: it sends a plain HTTP request
  // without opening a browser page, which is faster for a file check.
  test('resume PDF downloads from the site', async ({ request }) => {
    // Relative path is resolved against baseURL from the config.
    const response = await request.get('/assets/Lena_Grines.pdf');

    // HTTP status is 2xx (e.g. 200 OK), not 404 Not Found.
    expect(response.ok()).toBeTruthy();

    // The server says the file is a PDF (or a generic binary file).
    // `?? ''` avoids a crash if the header is missing; the match then fails.
    expect(response.headers()['content-type'] ?? '').toMatch(/pdf|octet-stream/i);
  });
});
