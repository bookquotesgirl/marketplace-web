// The live marketplace-api returns raw Mongoose documents, not the shape documented in
// API_CONTRACT.md: _id (not id), categoryId/vendorId (not category/vendor, populated with only
// a few fields), and images as [{ url, key }] (some seed data uses plain string URLs instead).
// This file is the one place that adapts that shape for the UI — see PROGRESS.md for the backend
// gaps this works around.

export function productImageUrl(image) {
  if (!image) return undefined;
  return typeof image === 'string' ? image : image.url;
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
