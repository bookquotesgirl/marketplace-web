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
- Story — App State Hooks: added `useAuth`/`useCart`/`useLanguage` selector hooks over the existing
  authStore/cartStore/uiStore (scaffold, language cycle + RTL, cart persistence, and ProtectedRoute
  redirect were already in place from earlier work); rewired Header, TopBar, ProtectedRoute, and
  ProductCard to consume the hooks instead of the raw stores; re-fixed ProductCard's dead `t`/
  `currency`/`handleAdd` (aria-label + currency prefix + real add-to-cart handler were unused —
  lint was failing on integration before this change) and added the missing
  `src/test/renderWithProviders` test helper referenced by Header.test.jsx/TopBar.test.jsx (test
  suite couldn't run before this change). Verified: lint/test/build all pass; Header+TopBar tests
  cover cart badge and en→am→ar language cycling with RTL flip.
