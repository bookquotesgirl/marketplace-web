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
