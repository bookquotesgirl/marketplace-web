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
- Story — Buyer Home + Browse (feat/buyer-home-browse): Home now fetches GET /api/products
  (limit 8, newest) + GET /api/categories for hero, category row, featured grid (ProductCard), and
  a top-vendors strip deduped from the fetched products (no public vendor-list endpoint exists in
  API_CONTRACT.md, so it isn't invented). Browse reads `?category=&page=` via useSearchParams, has a
  category Select and Prev/Next pagination driven by the response's page/pages, and both pages
  render loading (Spinner) / empty (t('common.noResults')) / error (t('common.error')) states. Added
  src/lib/mapProduct.js to map the API's product-list shape to ProductCard's prop shape (reused by
  Product page's related grid next). New home.*/browse.*/common.error i18n keys in en/am/ar. No
  hardcoded product/category data. lint + build clean; not click-tested against a live
  marketplace-api in this environment.
- Story — Buyer Product Page (feat/buyer-product-page): Product now fetches
  GET /api/products/:slug — gallery with thumbnail strip, title/rating/price, a variant selector
  (pill buttons, one per variant.attributes) that updates price/stock, a quantity input clamped to
  the selected variant's stock, and Add to cart wired to useCart (disabled + labeled out-of-stock
  when stock is 0). Vendor strip links to /store/:slug. Related products grid reuses
  mapProduct.js + GET /api/products?category=… (no dedicated related-products endpoint in
  API_CONTRACT.md), filtering out the current product. A 404 from the API renders a friendly
  not-found screen with a link back to /browse; other failures show the shared error state. Added
  product.* + common.addedToCart i18n keys in en/am/ar. lint + build clean; not click-tested
  against a live marketplace-api in this environment.
