---
name: run-tests
description: Runs the Playwright tests of this portfolio framework for the user and reports the results, so the user never has to use the terminal. Use when the user asks to run, rerun, or execute tests (all, smoke, one file, one test, desktop, mobile, the Sauce Demo login tests, or the API test), or types /run-tests.
---

# Run tests

The user runs tests by calling this skill instead of the terminal.
Calling the skill is the user's approval for you to run the test commands below yourself.
Run the command, then report the result. Reply in the user's language.

## 1. Pick the command

Run from the repo root. Combine options when the request combines them.

| User asks for | Command |
|---|---|
| everything (default) | `npx playwright test` |
| smoke | `npx playwright test --grep @smoke` |
| one file: home-page / navigation / contact / mobile-menu / accessibility / site-health / saucedemo-login / posts-api | `npx playwright test tests/<name>.spec.ts` |
| one test by its title or topic (e.g. "copy email") | `npx playwright test -g "<part of the test title>"` |
| one browser: Chrome / Firefox / WebKit (Safari) / mobile | add `--project=desktop-chrome` / `desktop-firefox` / `desktop-webkit` / `mobile-chrome` |
| login tests (Sauce Demo) | `npx playwright test --project=login` |
| one login case: valid / wrong password / locked out / empty username / empty password | `npx playwright test --project=login -g "<case words or TC id>"` |
| API test (JSONPlaceholder) | `npx playwright test --project=api` |
| watch the browser | add `--headed` |
| failed tests from the last run | add `--last-failed` |

To match a topic to a test title, read the `test(...)` titles in `tests/*.spec.ts`.
`tests/mobile-menu.spec.ts` runs only in `mobile-chrome`, `tests/saucedemo-login.spec.ts` only in `login` (live Sauce Demo site, needs internet), `tests/posts-api.spec.ts` only in `api` (live JSONPlaceholder API, needs internet); all other specs in `desktop-chrome`, `desktop-firefox`, and `desktop-webkit`.

## 2. Run it

- Node.js must be 20+ (`node -v`). If it is lower, stop and tell the user to install Node.js LTS from nodejs.org.
- The command launches a browser and starts a local web server on port 4174, so run it with permission to do both.
- Every test fails in ≈0 ms with "Executable doesn't exist" → Playwright cannot find its browser:
  1. If `PLAYWRIGHT_BROWSERS_PATH` is set, unset it so Playwright uses its default browser location.
  2. Still failing → run `npx playwright install chromium firefox webkit`.
  3. Rerun the tests once.
- Every login test fails on `page.goto` with `net::ERR_...` or a navigation timeout → Sauce Demo is unreachable. The API test fails with `getaddrinfo`, `ECONNREFUSED`, or `ETIMEDOUT` → JSONPlaceholder is unreachable. This is an environment problem, not a bug: tell the user to check the internet or retry later, and do not touch code.

## 3. Report

Use this format:

```
✅ 5 passed  |  ❌ 0 failed  |  ⏱ 4s
Command: npx playwright test --grep @smoke
```

For every failed test add:
- test title and `file:line`
- the failed check in plain words (expected vs actual)
- likely cause: **site bug** (site behaviour changed) or **test bug** (selector, timing, wrong expected value). Read `test-results/<test-folder>/error-context.md` to decide.
- path to the screenshot / video / trace in `test-results/`

For a login run, also list each case on its own line, e.g. `✅ TC-07c locked out user → error`.

After every run, open the Test Summary Report without asking: `open test-report/index.html` (macOS; see the `test-report` skill). Mention in the reply that it is open.
If something failed, offer the `analyze-failure` skill to investigate and fix.

## Rules

- Only run and report. Do not edit tests or the site unless the user asks.
- Do not rerun failed tests to make them pass; report the first result. Rerun only after a fix or when the user asks.
