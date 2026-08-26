// The live marketplace-api returns raw Mongoose documents, not the shape documented in
// API_CONTRACT.md: _id (not id), categoryId/vendorId (not category/vendor, populated with only
// a few fields), and images as [{ url, key }] (some seed data uses plain string URLs instead).
// This file is the one place that adapts that shape for the UI — see PROGRESS.md for the backend
// gaps this works around.
import { resolveAssetUrl } from './api';

export function productImageUrl(image) {
  if (!image) return undefined;
  return resolveAssetUrl(typeof image === 'string' ? image : image.url);
}

// GET /api/products/:slug wraps the product doc as { data: { product, variants, vendorSummary,
// reviewSummary } } rather than returning it flat — unwrap it once here rather than in the page.
// `reviewSummary.totalReviews` is unreliable (the backend query filters on the wrong field name
// and always returns 0), so callers should use the trustworthy `product.rating`/`reviewCount`
// instead, which the reviews endpoint keeps in sync on every new review.
export function unwrapProductDetail(payload) {
  return payload?.product ?? null;
}

// Maps a product document (list or detail) to the shape ProductCard expects.
export function mapProductCard(p) {
  return {
    _id: p._id,
    slug: p.slug,
    title: p.title,
    basePrice: p.basePrice ?? p.price,
    images: (p.images ?? []).map(productImageUrl).filter(Boolean),
    rating: p.rating,
    reviewCount: p.reviewCount,
    vendorName: p.vendorId?.storeName,
  };
}
