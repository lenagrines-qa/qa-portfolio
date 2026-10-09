# Lena Grines — QA Portfolio

[![Playwright tests](https://github.com/lenagrines-qa/qa-portfolio/actions/workflows/playwright.yml/badge.svg)](https://github.com/lenagrines-qa/qa-portfolio/actions/workflows/playwright.yml)

**Live site:** [lenagrines-qa.github.io/qa-portfolio](https://lenagrines-qa.github.io/qa-portfolio/) ·
**Latest test report:** [Test Summary Report](https://lenagrines-qa.github.io/qa-portfolio/report/)

My portfolio site (`site/`) and its test automation in one repo.
End-to-end UI, accessibility, and site-health tests for the site in Chrome, Firefox, and WebKit (Safari),
login tests for the [Sauce Demo](https://www.saucedemo.com) practice shop, and CRUD API tests for the
[JSONPlaceholder](https://jsonplaceholder.typicode.com) REST API, written with **Playwright + TypeScript**,
plus **Cursor agent skills** that write, run, and repair those tests under human review.

**47 test runs, all passing:** 12 site tests × 3 desktop browsers, 1 mobile, 5 login, 5 API.
The full run takes about 30 seconds locally.

- Page Object Model and custom fixtures
- Cross-browser: desktop Chrome, Firefox, WebKit (Safari), plus mobile Chrome (Pixel 7)
- Login and API projects — one config, three applications
- Positive, negative, data-driven, API, and accessibility (axe-core, WCAG 2.1 A/AA) checks
- `@smoke` tag for a fast critical-path run
- Test Summary Report (custom reporter): summary, metrics, coverage, defects, a screenshot of every test
- Video and trace on failure; GitHub Actions workflow

## Project structure

```text
site/                     The portfolio site under test: plain HTML, CSS, JS, resume PDF
playwright.config.ts      How tests run: base URL, devices, reports, local web server
pages/HomePage.ts         Page Object: portfolio locators and reusable actions
pages/LoginPage.ts        Page Object: Sauce Demo login form
fixtures/test.ts          Custom `homePage` / `loginPage` fixtures: create the Page Object and open the site
reporters/                Custom reporter that writes the Test Summary Report (test-report/index.html)
tests/
  home-page.spec.ts       TC-01  Name, role, email and resume buttons, smoke widget    @smoke
  navigation.spec.ts      TC-02  Header links reach the right sections
  contact.spec.ts         TC-03  Email/phone links, copy to clipboard, resume PDF      @smoke
  mobile-menu.spec.ts     TC-04  Hamburger menu on a phone-sized screen
  accessibility.spec.ts   TC-05  WCAG 2.1 A/AA scan, keyboard skip link
  site-health.spec.ts     TC-06  404 page, broken files, JavaScript errors
  saucedemo-login.spec.ts TC-07  Sauce Demo login: valid + 4 data-driven negative cases
  posts-api.spec.ts       TC-08  REST API: create, read, update, delete a post; 404 for a missing one
test-cases/TEST_CASES.md  Test case ↔ automated test map
docs/                     Recorded demo of the AI repair workflow
.cursor/rules/            Framework rules, always applied by the Cursor agent
.cursor/skills/           Cursor agent skills (see below)
.github/workflows/        CI: runs the suite on every push, publishes the site and report to GitHub Pages
```

## AI-assisted workflow

Each step of a test's life has its own skill. The agent does the typing; I review every result.

All skills follow one always-on project rule, [`.cursor/rules/framework-rules.mdc`](.cursor/rules/framework-rules.mdc): locator strategy, where code goes, no hard waits, facts only from the resume.

| Skill | Call | What it does |
|---|---|---|
| `write-test` | `/write-test TC-07` | Test case → test: finds real selectors in the site source, writes the test, proves it passes **and can fail**, updates the test case map |
| `run-tests` | `/run-tests smoke` | Runs all / smoke / login / API / one file / one test, reports pass/fail with the cause of each failure |
| `test-report` | `/test-report` | Runs the suite and opens the Test Summary Report: verdict, summary, metrics, coverage, defects, screenshots |
| `analyze-failure` | `/analyze-failure` | Classifies a failure as test bug, site bug, or environment; fixes the test (max 2 attempts) or writes a bug report; never weakens assertions |

See it in action: [docs/demo-analyze-failure.md](docs/demo-analyze-failure.md) — a broken locator, the evidence the skill collected, its verdict, and the one-line fix.

## Requirements

- Node.js 20+
- Python 3 (serves the static site locally)
- Internet access for the login and API tests (live Sauce Demo site and JSONPlaceholder API)

## Setup and run

```bash
npm install
npx playwright install chromium firefox webkit

npm test              # all tests
npm run test:smoke    # only @smoke tests
npm run test:ui       # Playwright UI mode
```

After every run, open `test-report/index.html` in a browser: one self-contained page with the summary,
release recommendation, coverage by area, defects, and every test with its screenshot.

The site is started automatically on port `4174`.
To test a deployed copy of the portfolio: `BASE_URL=https://your-site.example npm test`.

## What I would add next

- Visual regression snapshots for the hero on desktop and mobile
- An end-to-end Sauce Demo purchase journey: cart → checkout → order confirmation
- Run against the deployed site on a schedule to catch production-only issues
