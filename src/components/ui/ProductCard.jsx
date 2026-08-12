import { Link } from 'react-router-dom';
import Rating from './Rating';
import { useCartStore } from '../../store/cartStore';
// Matches the mockup card. Extend to pixel-match kitman-html.
export default function ProductCard({ product }) {
  const add = useCartStore((s) => s.add);
  const { slug, title, basePrice, images = [], rating = 0, reviewCount, vendorName } = product;
  return (
    <div className="group bg-white rounded-2xl ring-1 ring-black/5 shadow-soft overflow-hidden hover:shadow-card transition">
      <Link to={`/product/${slug}`} className="block aspect-square overflow-hidden">
        <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </Link>
      <div className="p-3">
        {vendorName && <p className="text-[11px] text-forest font-semibold truncate">{vendorName}</p>}
        <Link to={`/product/${slug}`}>
          <h3 className="text-sm font-semibold line-clamp-2 h-9 hover:text-forest">{title}</h3>
        </Link>
        <Rating value={rating} count={reviewCount} />
        <div className="flex items-center justify-between mt-2">
          <span className="font-extrabold text-forest">ETB {Number(basePrice).toLocaleString()}</span>
          <button
            onClick={() => add({ productId: product._id, variantId: null, title, price: basePrice, vendor: vendorName })}
            className="grid place-items-center w-9 h-9 rounded-xl bg-forest/10 text-forest hover:bg-forest hover:text-white transition"
            aria-label="Add to cart"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
