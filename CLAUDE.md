# CLAUDE.md — marketplace-web

This file guides Claude Code (and any engineer) working in this repository. Follow it on
every task without being asked.

---

## Project Identity

**Kitman Web** — the React (Vite) frontend for a multi-vendor marketplace in Ethiopia. One app
renders three surfaces: the **buyer storefront**, the **vendor dashboard**, and the **admin
console**, talking to `marketplace-api`.

- **Trilingual + RTL**: English, **Amharic (አማርኛ)**, **Arabic (العربية)**. Arabic is
  **right-to-left** — every screen (buyer, vendor, admin) must mirror correctly. This is a
  first-class requirement, not a polish item.
- **Currency** is **ETB**. Vendors run on a **subscription** (no sales commission).
- **The approved design is the source of truth**: static HTML in **`kitman-html/`** (inside this
  repo). It is a **UI/UX reference only** — a picture of exactly how things should look. **Never
  import from it, never make the app depend on it, and do not build/serve it.** Reproduce the look
  with our own React components + Tailwind tokens; the screens should look like `kitman-html/` but
  not reuse its code.

---

## Commands

```bash
cd marketplace-web
npm install
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm run dev                  # Vite → http://localhost:5173   (also /components-demo)
npm run build                # production build (must pass before "done")
npm run preview
npm run lint                 # eslint . --ext js,jsx
npm run format               # prettier --write .
npm test                     # Vitest — see "Testing" (add the tooling first, below)
```

## Stack

- **Vite + React 18** (JavaScript + JSX, ES modules).
- **Tailwind CSS** with the Kitman brand tokens in `tailwind.config.js` (colors + fonts).
- **React Router v6** (data via components; `<Layout>` + `<Outlet>`).
- **Zustand** for global state (`src/store`), with `persist` for cart + UI.
- **axios** API client (`src/lib/api.js`), base URL from `VITE_API_URL`.
- **i18next + react-i18next** for translations (`src/i18n`), RTL via `useApplyLanguage`.

Do **not** add a dependency without proposing it first (one-line justification) and waiting.

---

## Architecture

```
kitman-html/       the approved static design — the visual source of truth
src/
  components/
    Layout.jsx        Header + <Outlet> + Footer
    Header.jsx        logo, search, language cycle, cart badge (from cartStore)
    Footer.jsx
    ProtectedRoute.jsx  redirects to /login; optional role gate ('vendor' | 'admin')
    ui/               Button, Input, Select, Badge, Card, Modal, Spinner, Rating, Toast,
                      ProductCard  (+ index.js barrel)  — prop-driven, reused everywhere
  pages/              buyer pages + vendor/ + admin/  (wired in App.jsx)
  store/              authStore (token in memory) · cartStore + uiStore (persisted)
  lib/api.js          axios instance; request interceptor injects the auth token
  i18n/               i18n.js + locales/{en,am,ar}.json
  hooks/useApplyLanguage.js  syncs <html lang/dir>, i18next, and the dark class
  index.css           Tailwind layers + language-driven font-family
App.jsx               routes: buyer pages under <Layout>; /login /register; /vendor /admin (protected)
```

### Routing
- Buyer pages render inside `<Layout>`. `/login` and `/register` are standalone.
- `/vendor` and `/admin` are wrapped in `<ProtectedRoute role="…">`. Add nested routes under each.
- Product links use slugs: `/product/:slug`, `/store/:slug`.

### State (Zustand) — the rules
- **authStore**: `{ user, token }`. Token lives **in memory only** (not localStorage). `setAuth`,
  `logout`.
- **cartStore**: cart lines, `add/updateQty/remove/clear`, `count()`, `total()`. **Persisted** to
  `localStorage` (`kitman-cart`).
- **uiStore**: `{ language, dark }`, `cycleLanguage()` (en → am → ar), `toggleDark()`. **Persisted**.
- Stores hold **client state only** (cart, auth, UI). **Do not** cache server lists (products,
  orders) in Zustand — fetch those per page and keep them in local component state (or a query
  cache if we adopt one). No business logic in stores.

### Data fetching
- Always go through `src/lib/api.js` (never hardcode URLs; base URL comes from `VITE_API_URL`).
- Every fetch renders three states: **loading** (`Spinner`), **empty** (`t('common.noResults')`),
  and **error** (a `Toast`/message). No blank screens.
- **No hardcoded product/order data** in components — everything comes from the API.

### i18n & RTL (critical)
- **Every user-visible string goes through `t('…')`** with keys in `locales/en|am|ar.json`. No
  hardcoded English in JSX. Missing keys fall back to English (never blank).
- The language toggle cycles **English → Amharic → Arabic**. `useApplyLanguage` sets
  `<html lang>` and `<html dir>` (`rtl` for Arabic, else `ltr`) and switches i18next + fonts.
- **Use CSS logical utilities so RTL mirrors automatically**: `ms-*`/`me-*` (not `ml`/`mr`),
  `ps-*`/`pe-*` (not `pl`/`pr`), `start-*`/`end-*` (not `left`/`right`), `text-start`/`text-end`.
  Never hard-code `left`/`right`. For directional icons use `rtl:rotate-180`.
- Test **all three languages** — and specifically the **Arabic RTL mirror** on mobile and desktop —
  before calling a screen done.

### Styling
- Colors and fonts come from **`tailwind.config.js`** tokens (`forest`, `gold`, `crimson`, `cream`,
  `ink`; `font-sans/ethiopic/arabic`). **No stray hex values** in components.
- Match `kitman-html/` for spacing, radii, and component structure. Reuse `components/ui/*`
  instead of re-styling — no copy-paste duplication. `Button`, `Card`, `ProductCard`, etc. are the
  building blocks; extend their props rather than forking them.
- Mobile-first; verify at 375px and 1280px. Dark mode is supported via the `dark` class (`dark:`).

---

## Engineering Standards

- Components are **prop-driven and single-purpose**. Extract a `ui/` component when markup repeats.
- Keep components small; lift shared logic into `hooks/`. Handlers/effects do one thing.
- Accessibility: real `<button>`/`<label>`, `alt` text, focus states, `aria-label` on icon buttons.
- Never store tokens/secrets in `localStorage` or the DOM. Never log tokens.
- Keep the API contract in sync with `marketplace-api` — if a response shape changes there, update
  the consuming pages here in the same effort.

---

## Testing (how to write tests)

**Standard:** test **user-visible behavior**, not implementation details. Interactive logic (cart
math, forms/validation, language switching, protected routes, add-to-cart) is tested in the same
change as the code.

**Tooling to use** (add these devDeps + scripts, then they work):
```bash
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw
# package.json scripts:
#   "test": "vitest run",
#   "test:watch": "vitest",
#   "test:ui": "vitest --ui"
# vite.config.js → test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js' }
```
- **Vitest** runner + **React Testing Library** + **user-event**. Query by role/text like a user
  (`getByRole('button', { name: /add to cart/i })`), not by class or test-id where avoidable.
- **MSW** mocks the API at the network layer — do not mock `axios`. Define handlers for the
  endpoints a page calls.
- Render components with the providers they need (Router, i18n). Add a `renderWithProviders` helper.
- Because the app is trilingual, include at least one test that switches to **Arabic** and asserts
  `document.documentElement.dir === 'rtl'`.

**Where tests live:** co-located as `*.test.jsx` next to the component, or under `src/**/__tests__/`.

**Example** (`src/store/cartStore.test.js`):
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

beforeEach(() => useCartStore.getState().clear());

describe('cartStore', () => {
  it('merges quantity when the same product/variant is added twice', () => {
    const add = useCartStore.getState().add;
    add({ productId: 'p1', variantId: null, title: 'Phone', price: 100 });
    add({ productId: 'p1', variantId: null, title: 'Phone', price: 100, qty: 2 });
    expect(useCartStore.getState().count()).toBe(3);
    expect(useCartStore.getState().total()).toBe(300);
  });
});
```

---

## Working Agreement (standing orders)

### Session start
1. Restate the task as a 3–6 step plan **before** writing code. If scope is ambiguous, ask.
2. `git checkout main && git pull`, then branch: `feat/…`, `fix/…`, `chore/…`, `refactor/…`,
   `docs/…`. **Never commit to `main`.**
3. If the screen exists in `kitman-html/`, open it first and build to match.

### While coding
- Reuse `components/ui/*`, brand tokens, `t()` for every string, logical CSS utilities for RTL,
  and `src/lib/api.js` for every request. Mirror existing patterns before inventing.
- Write the tests in the same session.

### Self-check loop (mandatory before "done")
Run, in order: `npm run lint` → `npm test` → `npm run build`. All green, and the screen verified in
**EN, አማ, and Arabic-RTL** at mobile + desktop. Never weaken or skip a failing test to go green.

### Commits
- Atomic, conventional (`feat(product): variant picker updates price + stock`). Commit only what the
  task touches. Never `--no-verify`, never force-push `main`, never commit `.env`.

### End-of-session report (always, in order)
1. **Changed** — file-by-file, one line each (what & why).
2. **Tests** — suites run, pass/fail counts, what the new tests cover.
3. **i18n/RTL** — confirm new strings are in all three locale files and the screen mirrors in Arabic.
4. **Deviations** — anything done differently from the plan/design, and why.

### Hard rules
- No hardcoded UI text (use `t()`), no stray hex (use Tailwind tokens), no `left/right` utilities
  (use logical `start/end`). No tokens in `localStorage`. No new dependency without approval.
- A screen is not done until it passes lint + tests + build **and** works in all three languages
  including Arabic RTL.
## API Contract

The approved backend API contract is documented in `API_CONTRACT.md`.
Use it as the source of truth when implementing API integrations.
Do not invent endpoints, request fields, response fields, or error formats.