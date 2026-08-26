# PROGRESS — marketplace-web

Tracks completed stories and notable fixes, newest at the bottom.

---

## Scaffold

**Vite + React + Tailwind foundation**

- Vite + React 18 + Tailwind CSS with Kitman brand tokens (`forest`, `gold`, `crimson`, `cream`, `ink`)
- React Router v6 with all buyer routes + `/vendor` and `/admin` behind `ProtectedRoute`
- Zustand stores: `authStore` (token in memory), `cartStore` + `uiStore` (localStorage persisted)
- `axios` API client reading `VITE_API_URL`; `i18next` EN / አማርኛ / العربية + RTL + fonts
- Shared UI component library (`Button`, `Input`, `Badge`, `Card`, `Modal`, `Spinner`, `Rating`, `Toast`, `ProductCard`) + `/components-demo` route
- `Header` / `Footer` / `Layout`; static design reference in `kitman-html/`

---

## Story 1 — Shared UI Component Library

**Hardened the component library and demo page**

- Fixed `ProductCard`: `aria-label` via `t()`, configurable `currency` prop, image-initial fallback, optional `onAdd` override decoupling `cartStore`
- Added `Modal`, `Toast`, `ProductCard` to `/components-demo` with live state demos
- Added `gray` Badge tone and `Button` size variants
- Updated `src/components/README.md` with full prop tables and `ProductCard` shape/override docs

---

## Story 5 — Vendor & Admin Shells (`feat/vendor-admin-shells`)

**App shells, auth pages, and role-gated routing**

- `VendorShell` and `AdminShell` with sidebar navigation, nested via React Router `<Outlet>`
- `Login.jsx` — buyer sign-in against `POST /auth/login`
- `Register.jsx` — 3-step buyer OTP flow: `POST /auth/register/initiate → /verify → /complete`
  - OTP countdown + resend, `MAX_ATTEMPTS_EXCEEDED` lock, `+251`/`251`/`0` prefix stripping
- `VendorRegister` — 4-step flow submitting to `POST /auth/register-vendor`
- `ProtectedRoute` gates: `/vendor` (role=vendor), `/admin` (role=admin)
- All strings in EN / Amharic / Arabic with RTL support; lint + build passing

**Merge fixes (11-file conflict resolution)**
- Merged locale JSONs (topbar, header, categories, nav, footer keys)
- Nested vendor/admin sub-pages correctly under shells via `<Outlet>`
- Fixed `ProductCard` `currency` prop and `handleAdd` consistency
- Installed `lucide-react`; wired `Header` auth state reactivity (logout visible after sign-in)
- Merged dark mode body styles into `index.css`

---

## Story — App State Hooks

**Selector hooks over Zustand stores**

- Added `useAuth`, `useCart`, `useLanguage` hooks over `authStore` / `cartStore` / `uiStore`
- Rewired `Header`, `TopBar`, `ProtectedRoute`, `ProductCard` to use hooks instead of raw stores
- Re-fixed `ProductCard`'s dead `t` / `currency` / `handleAdd` (were unused, lint was failing)
- Added `src/test/renderWithProviders` helper needed by `Header.test.jsx` / `TopBar.test.jsx`
- Tests cover: cart badge, EN → AM → AR language cycling with RTL flip

---

## Story — Buyer Home + Browse (`feat/buyer-home-browse`)

**Real Home and Browse pages from live API data**

- `Home.jsx` — hero banner, category row (`GET /categories`), featured product grid + top vendors (`GET /products`); no hardcoded lists
- `Browse.jsx` — category filter + prev/next/numbered pagination via `useSearchParams` (`?category=&page=`)
- Added `home.*` / `browse.*` i18n keys to en/am/ar
- **API shape correction**: contract doc used `items`/`id`/`vendor.slug`; live backend returns raw Mongoose docs (`data`, `_id`, `categoryId`/`vendorId` populated, no `variants`). `src/lib/mapProduct.js` bridges the gap.

---

## Story — Buyer Product Page (`feat/buyer-product-page`)

**Full product detail page**

- `Product.jsx` — `GET /products/:slug`, image gallery with thumbnail strip, vendor link to `/store/:slug`
- Variant selector (pill buttons, disabled when `stock === 0`), updates price/stock; falls back to `basePrice`/`stock` since live backend has no `variants` yet
- Quantity input clamped to stock; Add to cart wired to `useCart`; out-of-stock disables button
- 404 from API → friendly not-found screen with link to `/browse`
- Related products from `GET /products?category=…` (same category, excluding current)

---

## Story — Checkout Flow (`feat/checkout-flow`)

**Checkout and order confirmation**

- `Checkout.jsx` — delivery address form (`name`/`phone`/`city`/`address` matching backend `shippingAddress`), order summary grouped per vendor, payment selector (ArifPay test-mode stub vs COD)
- `OrderConfirmation.jsx` at `/order-confirmation/:id` — order number, per-vendor sub-order cards with status badges, totals, address recap; loads via `GET /api/orders/:id` if opened without router state
- Both routes gated behind `ProtectedRoute role="buyer"`
- **Cart sync**: `cartStore` is client-only; `POST /api/orders` reads the *server-side* cart. Checkout syncs local cart to server (`DELETE /api/cart` then `POST /api/cart/items` per line) before placing the order
- **Saved addresses**: Checkout fetches and preselects the buyer's default saved address (`savedAddressId`); falls back to manual form — no backend change needed
- **Known backend gap**: `subOrders[].items[].title` is never populated by the API; Checkout enriches titles from local cart before navigating to confirmation (only fixes the immediate post-checkout view)
- Added `checkout.*` / `orderConfirm.*` i18n keys to en/am/ar
- Live-tested: 2-vendor COD order + ArifPay test-mode path; Arabic RTL confirmed

---

## Story — Order Tracking (`feat/order-tracking`)

**Order list and detail pages**

- `Orders.jsx` — `GET /orders` list: order number, date, total, overall status; empty + error states
- `OrderDetail.jsx` at `/orders/:id` — per-vendor sub-order card with placed→confirmed→shipped→delivered timeline; cancelled sub-orders show reason instead of timeline; address recap
- Re-order action on both pages: re-adds items to `cartStore` and navigates to `/cart`
- `src/lib/orderStatus.js` — `overallStatus()`: least-progressed non-cancelled sub-order status; `cancelled` only when every sub-order is cancelled. Shared with `OrderConfirmation.jsx`
- Both routes gated behind `ProtectedRoute role="buyer"`
- **Known backend gap**: `subOrders[].items[].title` unpopulated by `GET /orders`/`GET /orders/:id`; list/detail/re-order fall back to translated "Item" placeholder
- Added `orders.*` i18n keys to en/am/ar
- Live-tested: placed a real 2-vendor COD order, viewed list + detail, re-ordered, verified in Arabic RTL

---

## Story — Buyer Account + Forgot/Reset Password (`feat/buyer-account-pages`)

**Account section and password reset flow**

- `AccountLayout` at `/profile` — tabbed section: Profile, Addresses, Security, Orders (links to `/orders`)
- `AccountProfile` — edit name/phone via `PATCH /me/profile`; avatar picker reads file client-side (FileReader → data URL, 2MB / jpg+png cap) and sends in the same PATCH
- `AccountAddresses` + `AddressForm` (modal) — list/add/edit/delete/set-default against `GET|POST|PATCH|DELETE /me/addresses`; matches `User.addresses` schema exactly
- `AccountSecurity` — change password via `PATCH /me/change-password`
- `ForgotPassword.jsx` at `/forgot-password` → `POST /auth/forgot-password`
- `ResetPassword.jsx` at `/reset-password` → `POST /auth/reset-password`; dev-stub code surfaced on screen (backend echoes it when `NODE_ENV=development` + `SMS_PROVIDER=console`)
- Extracted `AuthShell` (topbar + hero panel) from Login/Register; Login's forgot-password link now points to `/forgot-password` and shows a success banner after reset
- Added `account.*` and extended `auth.*` / `checkout.*` i18n keys to en/am/ar
- Live-tested: reset password, edited profile, managed addresses, checked out with saved address, verified Arabic RTL throughout

---

## Story B — Vendor Product List + Buyer Cart (`feat/vendor-products-cart-ui`)

**First real vendor dashboard page and buyer cart**

- `Cart.jsx` — groups items by `item.vendor`, per-vendor qty steppers (`updateQty`), remove per line, per-vendor subtotals, grand total from `cartStore.total()`, empty state → `/browse`, checkout → `/checkout`
- `VendorProducts.jsx` (initial) — reads `GET /vendor/products` (`response.data.data`), loading / error / retry / empty states, product table with image, name, price, stock, status, actions
- Restored `ProductImage` as a reusable `components/ui/` component with `onError` + letter-initial fallback (lost in a merge conflict); wired into `ProductCard` and `Product.jsx`
- Added `cart.*` and initial `vendor.products.*` i18n keys to en/am/ar

---

## VendorShell + VendorProducts UI Overhaul (`feat/vendor-products-cart-ui`)

**Matched to `kitman-html/vendor-products.html` mockup**

**VendorShell redesign**
- Background: `bg-[#eef1ef] dark:bg-[#0a0e0c]` with fixed emerald + teal gradient blobs
- Sidebar: frosted glass (`bg-white/70 backdrop-blur-2xl rounded-[1.75rem] ring-1 shadow-[...]`)
- Nav items now have Lucide icons; active item gets forest background + glow shadow
- Layout changed from `ms-64` offset to `lg:flex lg:gap-6` with `lg:sticky` sidebar
- Exports `VendorShellContext` so child pages can open the mobile drawer

**VendorProducts page header**
- Mobile hamburger connected to `VendorShellContext.openDrawer`
- Language toggle (Globe → `cycleLanguage()`)
- Notifications bell (stub → toast)
- Dark mode toggle (Moon / Sun → `useUiStore.toggleDark`)
- Profile circle showing vendor store name or user name initial

**VendorProducts content**
- 4 summary chips (Total / Active / Out of stock / Drafts) — each clickable to filter the tab
- Toolbar: search input + tab pills (All / Active / Out of stock / Draft) + sort select
- 8-column table:
  - Select-all checkbox in header; per-row checkboxes with state
  - Product: `ProductImage` + title + slug
  - Category: pill from `categoryId.name`
  - Price: ETB formatted
  - Stock: crimson if 0, amber if < 10
  - Status: derived — `draft`→gray, `stock=0`→crimson "Out of stock", `stock<10`→amber "Low stock", else→forest "Active"
  - Sales: `—` (not in API yet)
  - Actions: Pencil / Copy / Eye (publish toggle) / Trash icon buttons
- Empty state + no-results state (when search/filter yields nothing)
- Footer: count + pagination stub

**Bulk action bar**
- Fixed bottom, appears when one or more rows are selected
- Shows: "N selected" · Unpublish (EyeOff) · Delete (crimson Trash2) · × to clear
- All action buttons are stubs showing "Coming soon" toast until backend endpoints exist

All new strings added to en / am / ar; lint and build passing.

---

## Story — Admin Vendors + Categories (`feat/vendor-admin-shells`)

**Full admin console pages for vendor management and category management**

### AdminVendors (`/admin/vendors`)

- Fetches vendor list from `GET /admin/vendors` (`items`, `total`, `page`, `pages`); paginates with 20/page
- Status chips (All / Approved / Pending / Suspended) with live counts from 4 parallel requests; each chip filters the table
- Toolbar: search input + status `<select>` filter; both are server-side params
- Table: store logo/initial · store name/slug · owner name · phone · plan (—) · status badge · KYC arrow
- **Status badges**: `pending`→amber, `approved`→emerald, `rejected`→crimson, `suspended`→gray
- **KYC drawer** slides from the `end` side (RTL-correct); shows owner name/phone, region, TIN, business name/type, doc type+number, join date
- **Confirm modal** for approve / reject / suspend / unsuspend actions; updates status immediately after `PATCH /admin/vendors/:id/status`
- API field mapping: `v.userId` (not `v.owner`), `kyc.docType` / `kyc.docNumber` (not `documentType`)
- **Status update fix**: after PATCH, uses `String(v._id) === String(vendor._id)` to normalize ObjectId comparison; spreads partial response with explicit `_id: v._id, status: mergedStatus`; filters list immediately when a status-specific tab is active so vendor disappears from the wrong filter

### AdminCategories (`/admin/categories`)

- Fetches categories from `GET /categories`; supports nested children via `flattenTree()` (depth-based indentation)
- 3 stat chips: Total / Active / Inactive derived from the flat list
- Table: depth-indented name (inline-start padding + ChevronRight for children) · slug · parent · active badge
- Row actions: + Add Sub (pre-fills `parentId`) · Pencil Edit · Trash Delete
- `CategoryFormModal`: create or edit; auto-generates slug from name; parent dropdown with depth indentation; image URL field; active toggle; `POST /admin/categories` or `PATCH /admin/categories/:id`
- `DeleteModal`: optional reassign-to select so products survive category deletion; `DELETE /admin/categories/:id?reassignTo=`
- Inline error from `err.response.data.message`

### AdminShell overhaul

- Added **shared top bar** (rendered in shell, not per-page): mobile hamburger, dynamic page title + subtitle derived from `useLocation()` matched against NAV array, Globe language toggle, dark mode, Bell, profile initial
- Nav entries have optional `subtitleKey` — vendors and categories show subtitles automatically
- Added `overflow-x-hidden` to the main wrapper to prevent horizontal bleed on mobile
- **Auth persistence**: `authStore` now uses Zustand `persist` with `sessionStorage` — admin login survives page refresh without storing the JWT in `localStorage`; cleared when tab closes

### i18n

- Added full `admin.vendors.*` and `admin.categories.*` key sets (title, subtitle, chips, columns, actions, confirmations, toasts) to all three locale files (EN / አማርኛ / العربية)

### Bug fixes

- **Toast props**: admin pages were passing `message`/`onClose` but `Toast` expects `show`/`children`; fixed to `<Toast show={!!toast}>{toast}</Toast>` with auto-dismiss `useEffect`
- Removed duplicate page headers (hamburger, globe, moon, bell, profile) from `AdminVendors` and `AdminCategories` — now sourced from `AdminShell`
- Removed unused `categories` state from `AdminCategories` (only `flat` is passed to children)

Lint and build passing.
