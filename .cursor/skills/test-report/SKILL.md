---
name: test-report
description: Builds and opens the Test Summary Report of this framework — one self-contained HTML page (test-report/index.html) with verdict, summary, release recommendation, metrics, scope, environment, coverage by area, defects, and a screenshot of every test. Use when the user asks to create, generate, build, open, or show the test report, HTML report, test summary, or results with screenshots, asks to change how the report looks, or types /test-report.
---

# Test report

The report is written by `reporters/summary-reporter.ts` after every Playwright run.
To create it, run the tests; never write or edit `test-report/index.html` by hand.
Calling this skill is the user's approval to run the commands below. Reply in the user's language.

## 1. Run the tests

| User asks for | Command |
|---|---|
| full report (default) | `npx playwright test` |
| report for a part (smoke / one file / login / api / mobile) | same options as in `.cursor/skills/run-tests/SKILL.md` |

The report covers only the tests of this run, so use the full suite unless the user asks for a part.
For environment problems (browser missing, Node < 20, no internet for login or API) follow `run-tests`.

## 2. Check the report

- The terminal ends with `Test summary report: test-report/index.html`.
- `test-report/index.html` was just modified.
- No line → the reporter crashed: read the error, fix `reporters/summary-reporter.ts`, rerun.

## 3. Open it

- For the user, always and without asking: `open test-report/index.html` (macOS; other OS — open the file in any browser).
- To look at it yourself: the IDE browser does not open `file://`, so serve it with
  `python3 -m http.server 9330 --bind 127.0.0.1 --directory test-report`, open `http://127.0.0.1:9330/`,
  and stop the server when done.

## 4. Reply

```
PASSED | 19 / 19 passed · 0 failed · 0 flaky · 100% · 7.7 s
Summary: <the summary sentence from the report>
Recommendation: <from the report>
Defects: none | <test title — expected vs received>
Report: test-report/index.html
```

If something failed, offer the `analyze-failure` skill.

## What the report contains

Keep this layout when changing the reporter:

1. Header: "Test Summary Report", title from the config option, date, duration, where it ran, verdict badge (PASSED green / PASSED WITH WARNINGS orange / FAILED red).
2. Summary paragraph in plain English + Recommendation (ready for release or not).
3. Metrics: Total, Passed, Failed, Flaky, Skipped, Pass rate.
4. Scope (configuration, application, device) and Environment (Playwright, browser engine, Node.js, OS, run on).
5. Coverage by area: one row per `describe` (TC-01 … TC-08), sorted by TC id.
6. Defects: failed and flaky tests with the first lines of the error, or "No defects found in this run."
7. Test results: a card per test with status, project, tags, duration, error, and screenshot (click to enlarge).

The file is self-contained: screenshots are embedded as base64, so it can be sent or opened anywhere.

## Changing the report

1. Edit only `reporters/summary-reporter.ts` (keep the English comments in the same style).
2. `npx tsc --noEmit`, then run the full suite and open the report.
3. Prove the failed state still works: temporarily change one expected value in a test, run that test,
   check the report shows FAILED, the defect with expected vs received, and "Not ready for release". Revert, rerun.

## Setup it relies on

- `playwright.config.ts`: reporter `['./reporters/summary-reporter.ts', { outputFile: 'test-report/index.html', title: '...' }]` and `screenshot: 'on'` (without it the cards have no screenshots).
- Every `describe` title starts with its TC id — the report groups and sorts areas by it.
- `test-report/` is in `.gitignore`: the report is rebuilt on every run and is not committed.

## Never

- Never edit `test-report/index.html` by hand or put numbers into it that did not come from a real run.
- Never hide or soften a failure to make the report look green.
