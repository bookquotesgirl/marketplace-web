// Maps a GET /api/products list item (API_CONTRACT.md §3) to the shape ProductCard expects.
export function mapProductCard(p) {
  return {
    _id: p.id,
    slug: p.slug,
    title: p.title,
    basePrice: p.price,
    images: p.images,
    rating: p.rating,
    reviewCount: p.reviewCount,
    vendorName: p.vendor?.storeName,
  };
}
