# Demo: `analyze-failure` skill fixes a broken locator

A real run, recorded step by step. A locator was broken on purpose to show how the
`analyze-failure` skill tells a **test bug** from a **site bug** and fixes only what is wrong.

## 1. The break

The mobile menu locator in `pages/HomePage.ts` was changed to a name the site does not use:

```diff
- this.menuButton = page.getByRole('button', { name: 'Menu' });
+ this.menuButton = page.getByRole('button', { name: 'Open menu' });
```

## 2. The failure

`/run-tests mobile` → `npx playwright test --project=mobile-chrome`

```text
✘ [mobile-chrome] › tests/mobile-menu.spec.ts:11:7 › TC-04 Mobile menu › menu opens, navigates to About, then closes

Error: expect(locator).toBeVisible() failed
Locator: getByRole('button', { name: 'Open menu' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

  at ../pages/HomePage.ts:95
  > 95 |     await expect(this.menuButton).toBeVisible();

1 failed
```

## 3. Evidence collected by the skill

| Source | What it shows |
|---|---|
| Error message | The test waits for `button "Open menu"`, element not found |
| `test-results/.../error-context.md` (page snapshot at failure) | `banner` contains `button "Menu"` — the button exists and is visible |
| Site source `site/index.html` | `<button class="menu" ... aria-controls="nav">Menu</button>` |
| Test case TC-04 | Expected: menu opens, About navigates, menu closes — nothing about the button name changed |

## 4. Verdict

```
Verdict: Test bug
Evidence: page snapshot and site source both have button "Menu"; the locator asks for "Open menu"
Action: restore the locator name in pages/HomePage.ts (1 line)
```

Not a site bug: the site renders the button and the feature works.
Not environment: only one test failed, after 5 s of waiting (environment failures fail every test in ≈0 ms).

## 5. The fix

```diff
- this.menuButton = page.getByRole('button', { name: 'Open menu' });
+ this.menuButton = page.getByRole('button', { name: 'Menu' });
```

One line in the Page Object. The test itself and its assertions were not touched —
the skill is not allowed to make a test green by weakening it.

## 6. Result

```text
✓ [mobile-chrome] › tests/mobile-menu.spec.ts:11:7 › TC-04 Mobile menu › menu opens, navigates to About, then closes
1 passed

npx playwright test --project=desktop-chrome --project=mobile-chrome   # all portfolio tests
13 passed
```

## Why this matters

- The fix went into **one place** (`HomePage.ts`) because all locators live in the Page Object.
- The decision was based on **evidence** (snapshot + site source), not on guessing.
- If the site had really lost the button, the skill would have written a bug report in
  `bug-reports/` instead of changing the test.
