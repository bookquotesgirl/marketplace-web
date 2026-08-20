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
