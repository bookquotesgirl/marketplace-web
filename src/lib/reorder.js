// Re-adds items from a past order's sub-order(s) to the cart. Item titles aren't
// reliably present on GET /orders responses (the backend snapshot field exists but is
// rarely populated) — callers pass a fallback label for that case.
export function addSubOrdersToCart(subOrders, add, fallbackTitle) {
  for (const sub of subOrders) {
    for (const item of sub.items) {
      add({
        productId: item.productId,
        variantId: item.variantId ?? null,
        title: item.title || fallbackTitle,
        price: item.priceSnapshot,
        qty: item.qty,
        vendor: sub.vendorName,
      });
    }
  }
}
