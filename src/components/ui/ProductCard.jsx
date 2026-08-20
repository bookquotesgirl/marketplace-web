import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Rating from './Rating';
import { useCart } from '../../hooks/useCart';

// Matches the mockup card. Extend to pixel-match kitman-html.
// onAdd(product) — optional override for the add-to-cart action (e.g. admin read-only views).
//   When omitted the card dispatches to the global cartStore (buyer storefront default).
// currency — ISO code displayed before the price; defaults to 'ETB'.
export default function ProductCard({ product, onAdd, currency = 'ETB' }) {
  const { t } = useTranslation();
  const { add } = useCart();
  const { slug, title, basePrice, images = [], rating = 0, reviewCount, vendorName } = product;

  const handleAdd = () => {
    if (onAdd) {
      onAdd(product);
    } else {
      add({ productId: product._id, variantId: null, title, price: basePrice, vendor: vendorName });
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft overflow-hidden hover:shadow-card transition">
      <Link to={`/product/${slug}`} className="block aspect-square overflow-hidden">
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      </Link>
      <div className="p-3">
        {vendorName && (
          <p className="text-[11px] text-forest font-semibold truncate">{vendorName}</p>
        )}
        <Link to={`/product/${slug}`}>
          <h3 className="text-sm font-semibold line-clamp-2 h-9 hover:text-forest">{title}</h3>
        </Link>
        <Rating value={rating} count={reviewCount} />
        <div className="flex items-center justify-between mt-2">
          <span className="font-extrabold text-forest">
            {currency} {Number(basePrice).toLocaleString()}
          </span>
          <button
            onClick={handleAdd}
            className="grid place-items-center w-9 h-9 rounded-xl bg-forest/10 text-forest hover:bg-forest hover:text-white transition"
            aria-label={t('common.addToCart')}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
