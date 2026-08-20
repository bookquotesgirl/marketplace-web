# Kitman API Contract — v3

## Changelog (v2 → v3)

| # | Endpoint(s) | Change |
|---|---|---|
| 1 | `POST /auth/register/initiate`, `/verify`, `/complete`, `/resend-otp` | **New** — buyer registration is now Phone → OTP → Complete (3 steps) |
| 2 | `POST /auth/register-vendor/initiate`, `/verify`, `/complete`, `/resend-otp` | **New** — vendor registration same multi-step pattern |
| 3 | `GET /auth/google`, `/google/callback`, `/google/me` | **New** — Google OAuth |
| 4 | `POST /auth/login`, `GET /auth/me` | `vendor.verified` → `vendor.status` (`pending`\|`approved`\|`rejected`\|`suspended`) |
| 5 | `POST /auth/register`, `/register-vendor`, `/send-otp`, `/verify-otp` | **Deprecated** — kept for backward compat, do not use in new code |

Everything below §1 is reproduced from v2 unchanged except §2 (Authentication).

## Base URL
All endpoints are prefixed with `/api`.

## Authentication
Most endpoints require a Bearer token in the `Authorization` header: `Authorization: Bearer <jwt_token>`. Public endpoints are marked as such.

---

## 1. Health & System

### GET /api/health
- **Auth:** Public
- **Response:** `200 OK`
  ```json
  { "status": "ok", "db": "connected" }
  ```

---

## 2. Authentication

---

### Buyer Registration — Phone → OTP → Complete

#### POST /api/auth/register/initiate
- **Auth:** Public
- **Body:**
  ```json
  { "phone": "+251911234567" }
  ```
- **Response:** `200 OK`
  ```json
  { "message": "OTP sent", "expiresIn": 10 }
  ```
  `expiresIn` is in minutes.
- **Errors:**
  - `409` — phone already registered
    ```json
    { "error": { "code": "PHONE_ALREADY_REGISTERED", "message": "An account with this phone number already exists." } }
    ```

#### POST /api/auth/register/verify
- **Auth:** Public
- **Body:**
  ```json
  { "phone": "+251911234567", "code": "123456" }
  ```
- **Response:** `200 OK`
  ```json
  { "message": "Phone verified" }
  ```
- **Errors:**
  - `400` — OTP expired
    ```json
    { "error": { "code": "SESSION_EXPIRED", "message": "The OTP session has expired. Please request a new code." } }
    ```
  - `400` — wrong code
    ```json
    { "error": { "code": "INVALID_OTP", "message": "The code you entered is incorrect." } }
    ```
  - `400` — too many wrong attempts
    ```json
    { "error": { "code": "MAX_ATTEMPTS_EXCEEDED", "message": "Too many incorrect attempts. Please request a new code." } }
    ```

#### POST /api/auth/register/complete
- **Auth:** Public
- **Body:**
  ```json
  { "phone": "+251911234567", "password": "string", "name": "Abebe Kebede" }
  ```
  `email` is optional and not collected by the UI.
- **Response:** `201 Created`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Abebe Kebede",
      "phone": "+251911234567",
      "email": null,
      "role": "buyer",
      "isPhoneVerified": true,
      "createdAt": "2026-08-20T09:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - `400` — validation (missing/weak password, missing name)
    ```json
    { "error": { "code": "VALIDATION_ERROR", "message": "..." } }
    ```

#### POST /api/auth/register/resend-otp
- **Auth:** Public
- **Body:**
  ```json
  { "phone": "+251911234567" }
  ```
- **Response:** `200 OK`
  ```json
  { "message": "OTP resent", "expiresIn": 10 }
  ```

---

### Login

#### POST /api/auth/login
- **Auth:** Public
- **Body:**
  ```json
  { "phone": "+251911234567", "password": "string" }
  ```
- **Response:** `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Abebe Kebede",
      "phone": "+251911234567",
      "email": null,
      "role": "buyer",
      "isPhoneVerified": true,
      "createdAt": "2026-07-22T09:00:00.000Z"
    }
  }
  ```
  When `role: "vendor"`, `user` also contains:
  ```json
  {
    "vendor": {
      "id": "vendor-id",
      "storeName": "Addis Tech",
      "slug": "addis-tech",
      "logoUrl": "/uploads/addis-tech-logo.jpg",
      "status": "approved",
      "plan": { "name": "Growth", "price": 1200.0, "renewsAt": "2026-08-26" }
    }
  }
  ```
  `vendor.status` is `pending | approved | rejected | suspended`. **`vendor.verified` (v2) is removed — use `status === "approved"` instead.**
- **Errors:**
  - `401`
    ```json
    { "error": { "code": "INVALID_CREDENTIALS", "message": "Phone number or password is incorrect." } }
    ```

---

### Get Current User

#### GET /api/auth/me
- **Auth:** Bearer Token
- **Response:** `200 OK` — Same shape as the `POST /auth/login` response.

---

### Google OAuth

#### GET /api/auth/google
- **Auth:** Public
- **Response:** Redirects to Google's OAuth consent screen. No body.

#### GET /api/auth/google/callback
- **Auth:** Public (OAuth redirect)
- **Response:** Redirects the browser to the frontend with `token` and `user` as query parameters:
  ```
  https://<frontend>/?token=eyJ...&user=%7B%22id%22%3A...%7D
  ```
  `user` is URL-encoded JSON matching the login response shape. Frontend must:
  ```js
  const token = params.get('token');
  const user  = JSON.parse(decodeURIComponent(params.get('user')));
  setAuth({ token, user });
  ```

#### GET /api/auth/google/me
- **Auth:** Bearer Token
- **Response:** `200 OK` — Same shape as `GET /api/auth/me`.

---

### Password Reset

#### POST /api/auth/forgot-password
- **Auth:** Public
- **Body:** `{ "phone": "+251911234567" }`
- **Response:** `200 OK` — Always succeeds (avoids account enumeration).
  ```json
  { "message": "Reset code sent if the account exists." }
  ```

#### POST /api/auth/reset-password
- **Auth:** Public
- **Body:** `{ "phone": "+251911234567", "code": "string", "newPassword": "string" }`
- **Response:** `200 OK`
  ```json
  { "message": "Password reset successfully." }
  ```
- **Errors:**
  - `400`
    ```json
    { "error": { "code": "INVALID_RESET_CODE", "message": "The reset code is invalid or has expired." } }
    ```

---

### Deprecated (do not use in new code)

These endpoints remain on the server for backward compatibility only.

| Endpoint | Replaced by |
|---|---|
| `POST /api/auth/register` | `register/initiate → verify → complete` |
| `POST /api/auth/register-vendor` | `register-vendor/initiate → verify → complete` |
| `POST /api/auth/send-otp` | `register/initiate` or `register/resend-otp` |
| `POST /api/auth/verify-otp` | `register/verify` |

---

## 3. Catalog (Public)

### GET /api/products
- **Auth:** Public
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `category` (category slug or ID)
  - `vendor` (vendor slug or ID)
  - `minPrice` (number)
  - `maxPrice` (number)
  - `rating` (number, min rating)
  - `sort` (string: `newest`, `price_asc`, `price_desc`, `rating`)
- **Response:** `200 OK`
  ```json
  {
    "items": [ { "id": "string", "title": "string", "slug": "string", "price": 123.45, "currency": "ETB", "images": ["url"], "rating": 4.5, "reviewCount": 10, "vendor": { "id": "string", "storeName": "string", "slug": "string" } } ],
    "total": 100,
    "page": 1,
    "pages": 5
  }
  ```

### GET /api/products/:slug
- **Auth:** Public
- **Response:** `200 OK`
  ```json
  {
    "id": "string",
    "title": "string",
    "slug": "string",
    "description": "string",
    "category": { "id": "string", "name": "string", "slug": "string" },
    "images": ["url1", "url2"],
    "basePrice": 100.00,
    "currency": "ETB",
    "status": "active",
    "rating": 4.5,
    "reviewCount": 10,
    "variants": [
      { "id": "string", "attributes": { "size": "M", "colour": "Red" }, "price": 110.00, "stock": 5, "sku": "SKU-123" }
    ],
    "vendor": { "id": "string", "storeName": "string", "slug": "string", "logoUrl": "url", "rating": 4.2 }
  }
  ```

### GET /api/categories
- **Auth:** Public
- **Response:** `200 OK` - Returns a nested category tree:
  ```json
  [
    { "id": "string", "name": "Electronics", "slug": "electronics", "parentId": null, "children": [ { "id": "string", "name": "Phones", "slug": "phones", "parentId": "parent-id" } ] }
  ]
  ```

### GET /api/vendors/:slug
- **Auth:** Public
- **Response:** `200 OK`
  ```json
  {
    "id": "string",
    "storeName": "string",
    "slug": "string",
    "logoUrl": "url",
    "bannerUrl": "url",
    "bio": "string",
    "rating": 4.8,
    "verified": true,
    "followers": 100,
    "products": {
      "items": [ /* Product objects */ ],
      "total": 50,
      "page": 1,
      "pages": 3
    }
  }
  ```

### GET /api/search
- **Auth:** Public
- **Query Parameters:** `q` (required), `category`, `minPrice`, `maxPrice`, `rating`, `vendor`, `sort`, `page`
- **Response:** Same structure as `GET /api/products` but filtered by text search.

---

## 4. Cart

### GET /api/cart
- **Auth:** Bearer Token
- **Response:** `200 OK`
  ```json
  {
    "groups": [
      {
        "vendorId": "vendor-id",
        "vendorName": "Store Name",
        "items": [
          { "id": "cart-item-id", "productId": "prod-id", "variantId": "var-id", "title": "Product Title", "price": 120.00, "qty": 2, "image": "url", "subtotal": 240.00 }
        ],
        "subtotal": 240.00
      }
    ],
    "total": 240.00
  }
  ```

### POST /api/cart/items
- **Auth:** Bearer Token
- **Body:** `{ "productId": "string", "variantId": "string", "qty": 1 }`
- **Response:** `201 Created` - Returns the updated cart. Errors with `400` if over stock.

### PATCH /api/cart/items/:itemId
- **Auth:** Bearer Token
- **Body:** `{ "qty": 2 }`
- **Response:** `200 OK` - Returns the updated cart.

### DELETE /api/cart/items/:itemId
- **Auth:** Bearer Token
- **Response:** `200 OK` - Returns the updated cart.

### DELETE /api/cart
- **Auth:** Bearer Token
- **Response:** `200 OK` - Clears the entire cart.

---

## 5. Checkout & Orders

### POST /api/orders
- **Auth:** Bearer Token
- **Body:**
  ```json
  {
    "shippingAddress": { "name": "string", "phone": "string", "city": "string", "address": "string" },
    "paymentMethod": "online | cod",
    "couponCode": "optional-string"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "order-id",
    "orderNumber": "ORD-123456",
    "total": 500.00,
    "paymentStatus": "paid | cod",
    "paymentRef": "fake-payment-ref",
    "subOrders": [
      {
        "id": "sub-order-id",
        "vendorId": "vendor-id",
        "vendorName": "Store Name",
        "items": [ { "productId": "prod-id", "title": "Title", "qty": 1, "price": 250.00 } ],
        "subtotal": 250.00,
        "status": "placed"
      }
    ],
    "createdAt": "ISO-date"
  }
  ```

### GET /api/orders
- **Auth:** Bearer Token (Buyer)
- **Response:** `200 OK` - List of the buyer's orders (with sub-orders summary).

### GET /api/orders/:id
- **Auth:** Bearer Token (Owner or Admin/Vendor involved)
- **Response:** `200 OK` - Full order details with sub-orders and shipping address.

### Status vocabulary & UI label mapping  `[CHANGED]` #10 (docs only)
Sub-order `status` values are `placed`, `confirmed`, `shipped`, `delivered`, `cancelled` (see #5
below for the addition of `cancelled`). `vendor-orders.html` displays these under different
labels; the frontend is expected to map, not the API to rename:

| API status | Vendor UI label |
|---|---|
| `placed` | New |
| `confirmed` | Processing |
| `shipped` | Shipped |
| `delivered` | Delivered |
| `cancelled` | Cancelled |

---

## 6. Reviews

### GET /api/products/:id/reviews
- **Auth:** Public
- **Query Parameters:** `page`, `limit`
- **Response:** `200 OK` - Paginated reviews with user info and verified badge.

### POST /api/products/:id/reviews
- **Auth:** Bearer Token
- **Body:** `{ "rating": 5, "comment": "Great product!" }`
- **Response:** `201 Created`
- **Constraints:** Only buyers who have a delivered order containing this product can review. One review per buyer per product.

---

## 7. Wishlist

### GET /api/wishlist
- **Auth:** Bearer Token
- **Response:** `200 OK` - List of products in the buyer's wishlist.

### POST /api/wishlist
- **Auth:** Bearer Token
- **Body:** `{ "productId": "string" }`
- **Response:** `201 Created`

### DELETE /api/wishlist/:productId
- **Auth:** Bearer Token
- **Response:** `200 OK`

---

## 8. Coupons

### POST /api/coupons/validate
- **Auth:** Bearer Token
- **Body:**
    ```json
    {
    "code": "SAVE10",
    "cart": {
        "items": [
        {
            "productId": "64f1a2b3c4d5e6f7a8b9c0d1",
            "variantId": "64f1a2b3c4d5e6f7a8b9c0d2",
            "title": "Wireless Headphones",
            "price": 250.00,
            "qty": 2,
            "image": "/uploads/headphones.jpg",
            "vendorId": "64f1a2b3c4d5e6f7a8b9c0d3",
            "vendorName": "Jane's Electronics",
            "subtotal": 500.00
        },
        {
            "productId": "64f1a2b3c4d5e6f7a8b9c0d4",
            "variantId": "64f1a2b3c4d5e6f7a8b9c0d5",
            "title": "Cotton T-Shirt",
            "price": 75.00,
            "qty": 1,
            "image": "/uploads/tshirt.jpg",
            "vendorId": "64f1a2b3c4d5e6f7a8b9c0d6",
            "vendorName": "Fashion Hub",
            "subtotal": 75.00
        }
        ],
        "total": 575.00
    }
    }
    ```
- **Response:** `200 OK` or `400 Bad Request`
  ```json
  { "valid": true, "discount": 50.00, "newTotal": 450.00, "coupon": { "id": "coupon-id", "code": "SAVE10", "type": "percent", "value": 10 } }
  ```

---

## 9. Vendor (Dashboard)

### GET /api/vendor/me  `[NEW]` #4
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK` - Full store profile:
  ```json
  {
    "id": "vendor-id",
    "storeName": "Addis Tech",
    "tagline": "string",
    "slug": "addis-tech",
    "description": "string",
    "logoUrl": "url",
    "bannerUrl": "url",
    "verified": true,
    "status": "approved",
    "plan": { "name": "Growth", "price": 1200.0, "renewsAt": "2026-08-26" }
  }
  ```
- **Evidence:** `vendor-settings.html` renders and edits store name, tagline, handle/slug, and description — none of it was fetchable in v1.
- **Scope note:** contact info, region/city/address, processing time, and shipping/return policy fields also appear on `vendor-settings.html` but are left out of this pass — they belong to the Settings story and will be added to this resource (or a `PATCH` sibling) when that story is scoped, rather than guessed at here.

### PATCH /api/vendor/me  `[NEW]` #4
- **Auth:** Bearer Token (role: vendor)
- **Body:** Partial `{ "storeName", "tagline", "slug", "description", "logoUrl", "bannerUrl" }`
- **Response:** `200 OK` - Updated profile. `409` if `slug` is already taken (`code: "SLUG_TAKEN"`).

### GET /api/vendor/dashboard  `[NEW]` #7
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK` - Composed payload for the dashboard home screen, matching `vendor-dashboard.html` exactly:
  ```json
  {
    "revenue30d": 128400.00,
    "revenue30dDelta": 0.12,
    "orders30d": 342,
    "orders30dDelta": 0.08,
    "productsCount": 48,
    "lowStockCount": 6,
    "storeViews30d": 12400,
    "storeViews30dDelta": 0.21,
    "salesLast7d": [
      { "date": "2026-07-21", "sales": 4200.00 },
      { "date": "2026-07-22", "sales": 5100.00 }
    ],
    "subscription": { "plan": "Growth", "price": 1200.00, "renewsAt": "2026-08-26" },
    "needsAttention": { "ordersToFulfill": 7, "lowStock": 6, "payoutReady": 84200.00 },
    "recentOrders": [ /* sub-order summaries, same shape as GET /vendor/orders */ ],
    "topProducts": [ { "productId": "id", "title": "string", "qtySold": 20, "image": "url" } ]
  }
  ```
- **Rationale:** avoids composing this screen client-side from three separate calls (`analytics` + `earnings` + `low-stock`); `analytics`, `earnings`, and `low-stock` remain available individually for their own dedicated screens.

### GET /api/vendor/products
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK` - All products belonging to the logged-in vendor (any status).

### POST /api/vendor/products
- **Auth:** Bearer Token (role: vendor)
- **Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "categoryId": "string",
    "images": ["url1", "url2"],
    "basePrice": 100.00,
    "variants": [
      { "attributes": { "size": "M" }, "price": 120.00, "stock": 10, "sku": "SKU-001" }
    ]
  }
  ```
- **Response:** `201 Created` - The new product.

### PATCH /api/vendor/products/:id
- **Auth:** Bearer Token (owner vendor)
- **Body:** Partial product fields.
- **Response:** `200 OK`

### DELETE /api/vendor/products/:id
- **Auth:** Bearer Token (owner vendor)
- **Response:** `204 No Content`

### POST /api/vendor/products/bulk

- **Auth:** Bearer Token (role: vendor)
- **Body:**
```json
{
  "rows": [
    {
      "title": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with USB receiver",
      "categoryId": "64f1a2b3c4d5e6f7a8b9c0e1",
      "images": ["/uploads/mouse-1.jpg", "/uploads/mouse-2.jpg"],
      "basePrice": 45.00,
      "variants": [
        {
          "attributes": { "colour": "Black" },
          "price": 45.00,
          "stock": 50,
          "sku": "WM-BLK-001"
        },
        {
          "attributes": { "colour": "White" },
          "price": 45.00,
          "stock": 30,
          "sku": "WM-WHT-001"
        }
      ]
    },
    {
      "title": "USB-C Cable",
      "description": "Fast charging USB-C cable 1m",
      "categoryId": "64f1a2b3c4d5e6f7a8b9c0e2",
      "images": ["/uploads/usbc-cable.jpg"],
      "basePrice": 15.00,
      "variants": [
        {
          "attributes": { "length": "1m" },
          "price": 15.00,
          "stock": 100,
          "sku": "USBC-1M-001"
        }
      ]
    },
    {
      "title": "",
      "description": "Missing title product",
      "categoryId": "64f1a2b3c4d5e6f7a8b9c0e3",
      "images": [],
      "basePrice": 20.00,
      "variants": []
    },
    {
      "title": "Bluetooth Speaker",
      "description": "Portable speaker with deep bass",
      "categoryId": "64f1a2b3c4d5e6f7a8b9c0e4",
      "images": ["/uploads/speaker.jpg"],
      "basePrice": 80.00,
      "variants": [
        {
          "attributes": { "colour": "Blue" },
          "price": 80.00,
          "stock": 0,
          "sku": "BS-BLU-001"
        }
      ]
    }
  ]
}
```

#### Success Response

**Status:** `200 OK`

```json
{
  "results": [
    {
      "row": 1,
      "status": "created",
      "productId": "64f1a2b3c4d5e6f7a8b9c0d8"
    },
    {
      "row": 2,
      "status": "created",
      "productId": "64f1a2b3c4d5e6f7a8b9c0d9"
    },
    {
      "row": 3,
      "status": "error",
      "message": "Missing title"
    },
    {
      "row": 4,
      "status": "error",
      "message": "Stock cannot be zero for variant: Blue"
    }
  ]
}
```

### GET /api/vendor/orders
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK` - Sub-orders belonging to this vendor.

### PATCH /api/vendor/orders/:subOrderId/status  `[CHANGED]` #5
- **Auth:** Bearer Token (role: vendor, owner of sub-order)
- **Body:** `{ "status": "confirmed | shipped | delivered | cancelled", "reason": "optional string, required if cancelled" }`
- **Response:** `200 OK`
- **Constraints:** Must follow legal transitions: `placed -> confirmed -> shipped -> delivered`. `cancelled` **(new)** is reachable from `placed` or `confirmed` only — once `shipped`, cancellation must go through support/admin dispute instead (`PATCH /admin/orders/:id`), not this endpoint.
- **Evidence:** `vendor-orders.html` has a live "Cancelled" filter tab and status badge that v1's transition list could never produce.

### GET /api/vendor/earnings
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK`
  ```json
  {
    "totalSales": 10000.00,
    "balance": 8500.00,
    "pendingBalance": 500.00,
    "commissionRate": 0.10,
    "payouts": [
      { "id": "payout-id", "amount": 1000.00, "status": "paid", "periodStart": "date", "periodEnd": "date" }
    ]
  }
  ```

### GET /api/vendor/low-stock
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK` - Products below the low-stock threshold.

### GET /api/vendor/analytics  `[CHANGED]` #6
- **Auth:** Bearer Token (role: vendor)
- **Response:** `200 OK`
  ```json
  {
    "totalSales": 10000.00,
    "ordersCount": 50,
    "productsCount": 48,
    "lowStockCount": 6,
    "storeViews30d": 12400,
    "bestSellers": [ { "productId": "id", "title": "Title", "qtySold": 20 } ],
    "salesOverTime": [ { "date": "2026-07-22", "sales": 500.00 } ]
  }
  ```
- **Note:** `productsCount`, `lowStockCount`, and `storeViews30d` are new fields. `salesOverTime` is documented as covering the trailing 7 days to match the "Sales this week" chart on `vendor-dashboard.html`; longer ranges can be added later with a `range` query param if a dedicated analytics screen needs them.
- **Open question:** `storeViews30d` requires page-view tracking that doesn't exist anywhere else in this contract (no `POST /vendor-store-view` beacon, no view-logging middleware). This field can be shipped as `0` until that instrumentation exists — flagging it rather than quietly faking a number.

---

## 10. Admin

### GET /api/admin/dashboard  `[NEW]` #9
- **Auth:** Bearer Token (role: admin)
- **Response:** `200 OK` - Composed payload for the admin overview screen, matching `admin-dashboard.html`:
  ```json
  {
    "gmv30d": 4820000.00,
    "gmv30dDelta": 0.18,
    "subscriptionMrr": 214800.00,
    "subscriptionMrrDelta": 0.09,
    "activeVendors": 2412,
    "activeVendorsDelta": 64,
    "pendingApprovals": 5,
    "pendingApprovalsNew": 3,
    "orders30d": 8940,
    "orders30dDelta": 0.12,
    "customersCount": 184200,
    "customersCountDelta": 0.07,
    "avgOrderValue": 1180.00,
    "avgOrderValueDelta": 0.03,
    "refundRate": 0.018,
    "refundRateDelta": 0.004,
    "growthOverTime": [ { "month": "2025-08", "gmv": 3100000.00, "subscriptionRevenue": 180000.00 } ],
    "topVendors": [ { "vendorId": "id", "storeName": "Name", "sales": 10000.00 } ]
  }
  ```

### GET /api/admin/vendors
- **Auth:** Bearer Token (role: admin)
- **Query Parameters:** `status` (pending | approved | rejected | suspended)
- **Response:** `200 OK` - List of vendors with KYC summary.

### GET /api/admin/vendors/:id
- **Auth:** Bearer Token (role: admin)
- **Response:** `200 OK` - Full vendor details including KYC documents.

### PATCH /api/admin/vendors/:id/status
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "status": "approved | rejected | suspended", "reason": "optional string" }`
- **Response:** `200 OK` - Updated vendor.

### POST /api/admin/staff
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "name": "string", "email": "string", "phone": "string", "password": "string", "role": "support | finance | operations" }`
- **Response:** `201 Created`

### GET /api/admin/categories
- **Auth:** Bearer Token (role: admin)
- **Response:** Full category tree (same as public but includes inactive).

### POST /api/admin/categories
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "name": "string", "parentId": "optional", "image": "optional-url", "isActive": true }`
- **Response:** `201 Created`

### PATCH /api/admin/categories/:id
- **Auth:** Bearer Token (role: admin)
- **Body:** Partial category fields.
- **Response:** `200 OK`

### DELETE /api/admin/categories/:id
- **Auth:** Bearer Token (role: admin)
- **Response:** `204 No Content` - Errors with `400` if products exist in this category.

### GET /api/admin/orders
- **Auth:** Bearer Token (role: admin)
- **Query Parameters:** `status`, `vendor`, `dateFrom`, `dateTo`
- **Response:** `200 OK` - All orders platform-wide.

### PATCH /api/admin/orders/:id
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "status": "disputed" }` (admin can only set to disputed for intervention)
- **Response:** `200 OK`

### CRUD /api/admin/plans
- **POST /api/admin/plans** - Create a subscription plan.
  - **Body:** `{ "name": "premium", "price": 1000.00, "features": ["string"], "active": true }`
- **GET /api/admin/plans** - List all plans.
- **PATCH /api/admin/plans/:id** - Update a plan.
- **DELETE /api/admin/plans/:id** - Deactivate a plan.

### POST /api/admin/vendors/:id/subscription
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "planId": "plan-id", "durationMonths": 12 }`
- **Response:** `201 Created` - Assign/renew a vendor's subscription.

### GET /api/admin/payouts
- **Auth:** Bearer Token (role: admin)
- **Response:** `200 OK` - Pending balances per vendor.

### POST /api/admin/payouts
- **Auth:** Bearer Token (role: admin)
- **Body:** `{ "vendorId": "vendor-id", "amount": 1500.00 }`
- **Response:** `201 Created` - Marks a payout as paid and reduces vendor balance.

### GET /api/admin/analytics  `[CHANGED]` #8
- **Auth:** Bearer Token (role: admin)
- **Response:** `200 OK`
  ```json
  {
    "revenue": 50000.00,
    "ordersCount": 250,
    "subscriptionMrr": 214800.00,
    "activeVendors": 2412,
    "pendingApprovals": 5,
    "customersCount": 184200,
    "avgOrderValue": 1180.00,
    "refundRate": 0.018,
    "topVendors": [ { "vendorId": "id", "storeName": "Name", "sales": 10000.00 } ],
    "growthOverTime": [ { "month": "2025-08", "revenue": 3100000.00 } ]
  }
  ```
- **Note:** `subscriptionMrr`, `activeVendors`, `pendingApprovals`, `customersCount`, `avgOrderValue`, and `refundRate` are new — v1 only covered `revenue` and `ordersCount`, but `admin-dashboard.html`'s KPI row renders 8 distinct metrics. `growthOverTime` is now documented as monthly (12-month trend), matching the chart's x-axis (`Aug…Jul`).

### CRUD /api/admin/banners
- **POST /api/admin/banners** - `{ "image": "url", "link": "optional", "order": 1, "active": true }`
- **GET /api/admin/banners** - List all banners.
- **PATCH /api/admin/banners/:id** - Update.
- **DELETE /api/admin/banners/:id** - Delete.

### GET /api/content
- **Auth:** Public
- **Response:** `200 OK` - Active banners and featured sections for the homepage.

---

## 11. Uploads

### POST /api/uploads
- **Auth:** Bearer Token (role: vendor or admin)
- **Body:** `multipart/form-data` with field `file` (image).
- **Constraints:** Max 5MB, image types only (jpg, png, webp, gif).
- **Response:** `201 Created`
  ```json
  { "url": "/uploads/filename-123.jpg" }
  ```

---

## Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

The `code` field is an optional machine-readable string (e.g., `INVALID_CREDENTIALS`, `OUT_OF_STOCK`, `COUPON_EXPIRED`, `SLUG_TAKEN`, `INVALID_RESET_CODE`) that allows the frontend to handle specific error states programmatically without parsing human-readable strings.

**Status Codes:**
- `400` - Validation error
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong role or ownership)
- `404` - Not found
- `409` - Conflict (duplicate, illegal state transition)
- `500` - Server error

---

## Pagination Format

All list endpoints that accept `page` and `limit` return:
```json
{
  "items": [ /* array of resources */ ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```