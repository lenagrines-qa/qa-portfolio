---
name: write-test
description: Turns a test case from test-cases/TEST_CASES.md (or a plain-language scenario) into a Playwright TypeScript test that follows this framework's conventions, then proves it passes and can fail. Use when the user asks to write, add, automate, or generate a test, or types /write-test with a TC id or scenario.
---

# Write test

Input: a TC id (e.g. `TC-07`) or a scenario in plain words.
Follow `.cursor/rules/framework-rules.mdc`. Reply in the user's language.

## Steps

1. **Agree the test case.** TC id → read its row in `test-cases/TEST_CASES.md`.
   Scenario → draft a row (next free id, case, expected result, file, project, tag), show it, and wait for the user's OK before writing code.
2. **Find real selectors.** Portfolio: read `site/index.html` and `site/js/main.js`. Sauce Demo: open the live page with Playwright and read its ARIA snapshot and `data-test` attributes. API: send the real request once and read the status, headers, and body. Never guess a selector or an expected value.
3. **Write the test.**
   - Add it to the spec that owns the feature; create `tests/<feature>.spec.ts` only for a new feature.
   - Title describes the behaviour: `'copy email button puts the address in the clipboard and confirms it'`, not `'copy test'`.
   - Start with a `// TC-xx: ...` comment; comment each check with what it proves, like the existing specs.
4. **Prove it passes.** Run `npx tsc --noEmit`, then the new test (see `run-tests` skill). Fix until green.
5. **Prove it can fail.** Temporarily change the expected value, run, confirm a clear failure, revert, run again. A test that cannot fail proves nothing.
6. **Update `TEST_CASES.md`** with the row.

## Report

TC id, test title and `file:line`, what it checks in one sentence, results of steps 4 and 5, files changed.
