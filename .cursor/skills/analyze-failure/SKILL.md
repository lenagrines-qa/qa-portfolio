---
name: analyze-failure
description: Investigates a failed Playwright test in this framework, decides whether it is a test bug, a site bug, or an environment problem, then fixes the test (max 2 attempts) or writes a bug report. Use when a test fails, is red or flaky, or when the user asks why a test failed, to fix or heal a test, or types /analyze-failure.
---

# Analyze failure

Input: a failing test title, file, or "the last run". Reply in the user's language.

## 1. Collect evidence

- No fresh failure → run the test first (see `.cursor/skills/run-tests/SKILL.md`).
- Read, in this order:
  1. the error message: failed assertion, expected vs received, `file:line`
  2. `test-results/<test-folder>/error-context.md` — ARIA snapshot of the page at the moment of failure
  3. the failing line in the spec and the locator it uses in `pages/`
  4. the site source: `site/index.html`, `site/js/main.js` (Sauce Demo and the API have no source here — the snapshot or the real response is the evidence)

## 2. Classify

| Verdict | Signs |
|---|---|
| **Environment** | all tests fail fast (≈0 ms); "Executable doesn't exist"; Node < 20; port 4174 busy; site folder missing; login tests fail on `page.goto` with `net::ERR_...` (no internet / Sauce Demo down); API test fails with `getaddrinfo` / `ECONNREFUSED` / `ETIMEDOUT` (no internet / JSONPlaceholder down) |
| **Test bug** | the element / text exists on the page and in the site source, but the locator, timing, or expected value in the test is wrong |
| **Site bug** | the site source or page snapshot shows the feature itself is broken or wrong against the resume / test case |

State the verdict with the evidence line that proves it (e.g. the snapshot shows `button "Menu"`, the test looks for `button "Open menu"`).

## 3. Act

**Environment** → tell the user the exact fix (see `run-tests` skill). Do not touch code.

**Test bug** → fix the test:
1. Smallest change that makes the test match the real site: usually one locator in a Page Object or one expected value.
2. Show the diff before/after.
3. Rerun the failing test, then the full suite.
4. Still red → one more attempt with new evidence. After 2 attempts, stop and report what you learned.

**Site bug** → do not change the test. Write `bug-reports/BUG-<NNN>-<short-slug>.md`:

```markdown
# BUG-NNN: <short title>

**Severity:** Critical | Major | Minor
**Found by:** <test title> (`<file:line>`)
**Environment:** <project, browser, viewport>, local site, <date>

## Steps to reproduce
1. ...

## Expected
...

## Actual
...

## Evidence
- Error: <assertion message>
- Screenshot / trace: `test-results/<folder>/...`
```

## Never

- Never make a test green by weakening it: deleting or commenting out an `expect`, adding `waitForTimeout`, raising timeouts without evidence, adding `force: true`, or changing the expected value to match a broken site.
- Never edit the site (`site/`).

## Report

```
Verdict: Test bug | Site bug | Environment
Evidence: <one line>
Action: <diff summary | bug report path | environment fix>
Result: <test and suite status after the action>
```
