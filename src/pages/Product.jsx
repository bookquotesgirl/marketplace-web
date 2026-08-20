import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { useCart } from '../hooks/useCart';
import { ProductCard, Rating, Spinner } from '../components/ui';

function variantLabel(variant) {
  return Object.values(variant.attributes || {}).join(' / ') || variant.sku;
}

export default function Product() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { add } = useCart();

  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setProduct(null);
    setRelated([]);
    setActiveImage(0);
    setQty(1);
    setAdded(false);

    api
      .get(`/products/${slug}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        setProduct(p);
        setSelectedVariantId(p.variants?.[0]?.id ?? null);
        setStatus('ready');
        if (p.category?.slug) {
          api
            .get('/products', { params: { category: p.category.slug, limit: 5 } })
            .then((relRes) => {
              if (cancelled) return;
              setRelated((relRes.data.items ?? []).filter((item) => item.slug !== p.slug).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? 'notfound' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = useMemo(
    () => product?.variants?.find((v) => v.id === selectedVariantId) ?? null,
    [product, selectedVariantId]
  );

  const price = selectedVariant?.price ?? product?.basePrice;
  const stock = selectedVariant?.stock;
  const outOfStock = selectedVariant != null && stock <= 0;

  const handleAdd = () => {
    if (!product || outOfStock) return;
    add({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      title: product.title,
      price,
      qty,
      vendor: product.vendor?.storeName,
    });
    setAdded(true);
  };

  if (status === 'loading') {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 grid place-items-center">
        <Spinner />
      </section>
    );
  }

  if (status === 'notfound') {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold">{t('product.notFoundTitle')}</h1>
        <p className="text-ink/60 mt-2">{t('product.notFoundBody')}</p>
        <Link to="/browse" className="inline-block mt-6 px-5 h-11 leading-[44px] rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark">
          {t('product.backToBrowse')}
        </Link>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 text-center text-ink/60">{t('common.error')}</section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-black/5">
            {product.images?.[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-ink/20 text-6xl font-bold select-none">
                {product.title?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden ring-2 ${i === activeImage ? 'ring-forest' : 'ring-black/10'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.vendor && (
            <Link to={`/store/${product.vendor.slug}`} className="text-sm font-semibold text-forest hover:underline">
              {product.vendor.storeName}
            </Link>
          )}
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">{product.title}</h1>
          <div className="mt-2">
            <Rating value={product.rating} count={product.reviewCount} />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">
            {product.currency} {Number(price).toLocaleString()}
          </p>

          {selectedVariant && (
            <p className="mt-1 text-sm">
              {outOfStock ? (
                <span className="text-crimson font-semibold">{t('product.outOfStock')}</span>
              ) : (
                <span className="text-ink/60">{t('product.inStock', { count: stock })}</span>
              )}
            </p>
          )}

          {product.variants?.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQty(1);
                  }}
                  disabled={v.stock <= 0}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ring-1 transition disabled:opacity-40 disabled:cursor-not-allowed
                    ${v.id === selectedVariantId ? 'bg-forest text-white ring-forest' : 'ring-black/10 hover:ring-forest'}`}
                >
                  {variantLabel(v)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink/60">{t('product.quantity')}</span>
              <input
                type="number"
                min={1}
                max={selectedVariant ? Math.max(stock, 1) : undefined}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 px-3 py-2 rounded-xl ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-forest text-sm"
              />
            </label>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex-1 h-11 px-6 rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('common.addToCart')}
            </button>
          </div>
          {added && <p className="mt-2 text-sm text-forest font-semibold">{t('common.addedToCart')}</p>}

          {product.description && <p className="mt-6 text-ink/70 whitespace-pre-line">{product.description}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl md:text-2xl font-extrabold">{t('product.related')}</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={mapProductCard(p)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
