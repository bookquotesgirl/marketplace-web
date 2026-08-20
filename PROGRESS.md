# PROGRESS — marketplace-web

One line per merged PR: what you did.

- Scaffold: Vite + React + Tailwind (Kitman brand tokens), React Router with all buyer
  routes + vendor/admin (ProtectedRoute), Zustand stores (auth/cart/ui) with localStorage
  persistence, axios API client (VITE_API_URL), i18next EN/አማ/ar + RTL + fonts, shared UI
  component library + /components-demo, Header/Footer Layout. Static design reference in kitman-html/.
- Story 1 — Shared UI Component Library: fixed ProductCard (aria-label via t('common.addToCart'),
  configurable currency prop, image-initial fallback, optional onAdd override decoupling cart store);
  added Modal + Toast + ProductCard to /components-demo with live state demos; added gray Badge tone
  and Button size variants to demo; updated src/components/README.md with full prop tables and
  ProductCard shape/override docs.
- Story 5 (feat/vendor-admin-shells) — Vendor and admin app shells implemented with sidebar
  navigation and nested routing via React Router v6 Outlet; Login and Register auth pages built
  against the approved API contract (POST /auth/login, POST /auth/register); VendorRegister
  4-step flow submitting to POST /auth/register-vendor; role-based ProtectedRoute gates
  /vendor (role=vendor) and /admin (role=admin); all strings in EN/Amharic/Arabic with RTL
  support; lint, tests, and build passing.
- Merge + fixes (feat/vendor-admin-shells) — resolved 11-file merge conflict (locale JSONs,
  index.css, tailwind.config, Login, Register, AdminDashboard, VendorDashboard, API_CONTRACT);
  merged new i18n keys (topbar, header, categories, nav.wishlist, expanded footer) while
  preserving auth/vendor/admin translations; wired vendor and admin sub-pages as nested routes
  under VendorShell/AdminShell (Outlet pattern); fixed ProductCard to use currency prop and
  handleAdd consistently; installed lucide-react; Header auth state now reactive (shows
  logout when signed in); Login.jsx refactored to login-only using POST /auth/login —
  "Create account" tab navigates to /register; Register.jsx implements the v3 3-step buyer
  registration flow (POST /auth/register/initiate → /verify → /complete) with OTP countdown,
  resend, locked state on MAX_ATTEMPTS_EXCEEDED, and prefix stripping (+251/251/0) on phone
  input; dark mode body styles merged into index.css; all strings trilingual, lint and build
  passing.
- Story — App State Hooks: added `useAuth`/`useCart`/`useLanguage` selector hooks over the existing
  authStore/cartStore/uiStore (scaffold, language cycle + RTL, cart persistence, and ProtectedRoute
  redirect were already in place from earlier work); rewired Header, TopBar, ProtectedRoute, and
  ProductCard to consume the hooks instead of the raw stores; re-fixed ProductCard's dead `t`/
  `currency`/`handleAdd` (aria-label + currency prefix + real add-to-cart handler were unused —
  lint was failing on integration before this change) and added the missing
  `src/test/renderWithProviders` test helper referenced by Header.test.jsx/TopBar.test.jsx (test
  suite couldn't run before this change). Verified: lint/test/build all pass; Header+TopBar tests
  cover cart badge and en→am→ar language cycling with RTL flip.
- Story — Buyer Home + Browse (feat/buyer-home-browse): built the real Home page (hero banner,
  category row from GET /categories, featured ProductCard grid + top vendors from GET /products,
  all deduped/derived from real API data, no hardcoded lists) and the real Browse page (category
  filter + prev/next/numbered pagination reading/writing `?category=&page=` via useSearchParams,
  ProductCard grid from GET /products). Both reuse the existing Header/Footer Layout and Spinner /
  `common.noResults` / `common.error` states; the data-fetching (state, effects, api.js calls) was
  already scaffolded from earlier work — this fills in the missing JSX. Added `home.*`/`browse.*`
  i18n keys to en/am/ar. Verified: lint/test/build all pass; dev server smoke-tested against
  `/`, `/browse`, `/browse?category=…`, `/browse?page=2` (no live marketplace-api in this
  environment, so this is contract-shape verification, not a real seeded-data click-through).
- Correction — API shape: the above Home/Browse work was built strictly against the documented
  `API_CONTRACT.md` (`items`/`id`/`slug`/`vendor.slug`). Reading the actual backend
  (`back/src/controllers/product.controller.js`, `product.model.js`) shows the *live* API returns
  raw Mongoose documents instead: `{ data, currentPage, totalPages }` with `_id`,
  `categoryId`/`vendorId` (populated, `vendorId` has no `slug`), and **no `variants` field on the
  product model at all yet**. `src/lib/mapProduct.js` documents this gap. When
  `feat/buyer-home-browse` was merged into `feat/buyer-product-page`, the real-shape Home/Browse
  (already built earlier on this branch) was correctly kept over the contract-only version — no
  further action needed there, but `API_CONTRACT.md` is stale and worth a backend-side fix.
- Story — Buyer Product Page (feat/buyer-product-page): verified/repaired after the
  feat/buyer-home-browse merge — the merge resolution had kept all of Product.jsx's data-fetching
  (GET /products/:slug, related products via GET /products?category=…) and handlers intact but
  reverted the actual render to a placeholder, leaving `mapProductCard`, `ProductCard`, `Rating`,
  `variantLabel`, `related`, `activeImage`, `added`, and `handleAdd` unused (lint was failing).
  Restored the real render: image gallery with thumbnail strip, vendor strip linking to
  `/store/:slug`, title/rating/price, a variant selector (pill buttons, disabled when a variant's
  stock is 0) that updates price/stock — falls back to the product's own basePrice/stock since the
  live backend has no `variants` data yet — a quantity input clamped to stock, and Add to cart
  wired to `useCart` (disabled + labeled out-of-stock at 0 stock). A 404 from the API renders a
  friendly not-found screen linking back to `/browse`; other failures show the shared error state.
  Verified: lint/test/build all pass; dev server smoke-tested `/product/:slug` (no live
  marketplace-api in this environment, so add-to-cart → cart-badge and real variant switching are
  not yet click-tested against seeded data).
