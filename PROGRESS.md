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
- Story — App State (chore/app-state): added useAuth/useCart/useLanguage hooks as the app-facing
  API over authStore/cartStore/uiStore (auth in memory; cart+language persisted, language cycle
  en→am→ar drives RTL via useApplyLanguage). Repointed Header, ProtectedRoute, and ProductCard to
  consume the new hooks instead of the stores directly. Verified: language cycle flips dir="rtl" on
  Arabic, cart survives refresh (localStorage), /vendor and /admin redirect to /login when logged
  out. lint + build clean.
