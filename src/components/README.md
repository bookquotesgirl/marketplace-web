# Shared UI components

Prop-driven, Tailwind + brand tokens. Import from the barrel and reuse everywhere — no copy-paste styling.

```js
import { Button, Input, Select, Badge, Card, Modal, Spinner, Rating, Toast, ProductCard } from '../components/ui';
```

Visual check: run the app and open `/components-demo`.

---

## Component reference

| Component | Key props | Notes |
|-----------|-----------|-------|
| `Button` | `variant` (primary\|secondary\|gold\|ghost), `size` (sm\|md\|lg), `disabled`, `className` | Spreads all `<button>` attrs |
| `Input` | `label`, `className`, ...input props | Wraps `<input>` in a `<label>`; all native input attrs pass through |
| `Select` | `label`, `children` (options), `className`, ...select props | Same wrapper pattern as Input |
| `Badge` | `tone` (forest\|gold\|crimson\|gray), `children` | Inline pill label |
| `Card` | `className`, `children` | White rounded surface with soft shadow |
| `Modal` | `open` (bool), `onClose` (fn), `title` (string?), `children` | Backdrop click calls `onClose`; renders nothing when `open` is false |
| `Spinner` | `className` | Animated border ring in `forest` color |
| `Rating` | `value` (0–5), `count` (number?) | Renders filled/empty stars; omit `count` to hide the review count |
| `Toast` | `show` (bool), `children` | Fixed bottom-center banner; renders nothing when `show` is false |
| `ProductCard` | `product` (object), `onAdd` (fn?), `currency` (string?) | See shape below |

### ProductCard — `product` shape

```js
{
  _id: string,          // used as cart line key
  slug: string,         // href → /product/:slug
  title: string,
  basePrice: number,    // displayed as `{currency} {basePrice.toLocaleString()}`
  images: string[],     // images[0] used; empty array shows a letter-initial fallback
  rating: number,       // 0–5
  reviewCount: number,  // optional; omit to hide count
  vendorName: string,   // optional; omit to hide vendor label
}
```

### ProductCard — optional props

| Prop | Default | Purpose |
|------|---------|---------|
| `onAdd(product)` | dispatches to `cartStore` | Override add-to-cart. Pass a no-op or custom handler in admin/vendor contexts where the global cart should not be used. |
| `currency` | `'ETB'` | ISO currency code shown before the price. |
