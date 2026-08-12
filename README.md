# marketplace-web

React (Vite) frontend for the Kitman multi-vendor marketplace — buyer storefront, vendor
dashboard and admin console. Trilingual (English / አማርኛ / العربية) with full RTL for Arabic.

**Team:** Kernemi (Buyer) · Zionawit (Design system & storefront) · Hiwot (Vendor & Admin)

## Quick start
```bash
cd marketplace-web
npm install
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:5173
```
Also try `/components-demo`. The static design reference is in **`kitman-html/`** (reference only) — convert
those pages into the React pages under `src/pages`.

## Structure
```
kitman-html/          the approved static HTML design (source of truth for look & feel)
src/
  components/     Layout, Header, Footer, ProtectedRoute, ui/ (Button, Card, ProductCard, …)
  pages/          buyer pages + vendor/ + admin/ (placeholders wired into the router)
  store/          Zustand: authStore, cartStore, uiStore (cart + language persist)
  lib/api.js      axios client (baseURL from VITE_API_URL, injects auth token)
  i18n/           i18next config + locales/en|am|ar.json  (RTL handled in useApplyLanguage)
  hooks/          useApplyLanguage (syncs <html lang/dir>, i18n, dark class)
```

## Conventions
- One story = one branch = one PR. Brand colors come from `tailwind.config.js` (no stray hex).
- Use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) so Arabic RTL mirrors automatically.
- Language toggle cycles EN → አማ → ع; selecting Arabic sets `dir="rtl"`.
