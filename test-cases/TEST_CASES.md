# Test cases ↔ automated tests

Expected values (name, role, email, phone) come from the resume: `site/assets/Lena_Grines.pdf`.

| ID | Test case | Expected result | Automated in | Project | Tag |
|---|---|---|---|---|---|
| TC-01 | Home page name, role, and buttons | Title has "Lena Grines"; H1 name visible; role "Senior QA Engineer"; email CTA → `mailto:lenagrines.qa@gmail.com`; resume CTA → `assets/Lena_Grines.pdf` | `tests/home-page.spec.ts` | desktop-chrome | `@smoke` |
| TC-01b | On-page smoke widget | Status "5 / 5 passed…", widget has class `passed`, 5 rows marked ok | `tests/home-page.spec.ts` | desktop-chrome | `@smoke` |
| TC-02 | Desktop navigation | About, Tools, Experience, Work, Contact each set the URL hash and show their section | `tests/navigation.spec.ts` | desktop-chrome | |
| TC-02b | Current job in Experience | Heading "Senior QA Engineer · WTS" visible | `tests/navigation.spec.ts` | desktop-chrome | |
| TC-03 | Contact links | Email → `mailto:lenagrines.qa@gmail.com`; phone → `tel:+17869418197` | `tests/contact.spec.ts` | desktop-chrome | `@smoke` |
| TC-03b | Copy email | Confirmation message shown; clipboard contains the email | `tests/contact.spec.ts` | desktop-chrome | `@smoke` |
| TC-03c | Resume PDF available | `GET /assets/Lena_Grines.pdf` returns 2xx with a PDF content type | `tests/contact.spec.ts` | desktop-chrome | `@smoke` |
| TC-04 | Mobile menu | Menu opens; tapping About goes to `#about`; menu closes | `tests/mobile-menu.spec.ts` | mobile-chrome | |
| TC-05 | Accessibility scan | axe-core finds no WCAG 2.1 A/AA violations on the home page | `tests/accessibility.spec.ts` | desktop-chrome | |
| TC-05b | Keyboard skip link | First Tab focuses "Skip to content"; Enter goes to `#main` and shows main content | `tests/accessibility.spec.ts` | desktop-chrome | |
| TC-06 | Unknown page | `GET /this-page-does-not-exist.html` returns 404 | `tests/site-health.spec.ts` | desktop-chrome | |
| TC-06b | No broken files | Every own CSS/JS/image request on load answers below 400; none fail | `tests/site-health.spec.ts` | desktop-chrome | |
| TC-06c | No JavaScript errors | No uncaught exceptions and no console errors from own files during load | `tests/site-health.spec.ts` | desktop-chrome | |

## Sauce Demo login (https://www.saucedemo.com)

Public practice shop; credentials are published on its login page (password for all users: `secret_sauce`).

| ID | Test case | Expected result | Automated in | Project | Tag |
|---|---|---|---|---|---|
| TC-07 | Valid login | `standard_user` lands on `/inventory.html`, title "Products" | `tests/saucedemo-login.spec.ts` | login | |
| TC-07b | Wrong password | Error "Username and password do not match any user in this service"; stays on login | `tests/saucedemo-login.spec.ts` | login | |
| TC-07c | Locked out user | `locked_out_user`: error "Sorry, this user has been locked out."; stays on login | `tests/saucedemo-login.spec.ts` | login | |
| TC-07d | Empty username | Error "Username is required"; stays on login | `tests/saucedemo-login.spec.ts` | login | |
| TC-07e | Empty password | Error "Password is required"; stays on login | `tests/saucedemo-login.spec.ts` | login | |

## JSONPlaceholder API (https://jsonplaceholder.typicode.com)

Public practice REST API; it answers like a real backend but does not save data.

| ID | Test case | Expected result | Automated in | Project | Tag |
|---|---|---|---|---|---|
| TC-08 | Create a post | `POST /posts` with title, body, userId → 201, JSON, body echoes the sent fields plus a numeric `id` | `tests/posts-api.spec.ts` | api | |
