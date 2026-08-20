import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard, productImageUrl } from '../lib/mapProduct';
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
        const p = res.data?.data;
        setProduct(p);
        // The API doesn't attach `variants` to this response yet (see PROGRESS.md) — this
        // stays empty until the backend does, and the page falls back to product.stock/price.
        setSelectedVariantId(p.variants?.[0]?._id ?? null);
        setStatus('ready');
        if (p.categoryId?._id) {
          api
            .get('/products', { params: { category: p.categoryId._id, limit: 5 } })
            .then((relRes) => {
              if (cancelled) return;
              setRelated((relRes.data?.data ?? []).filter((item) => item.slug !== p.slug).slice(0, 4));
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
    () => product?.variants?.find((v) => v._id === selectedVariantId) ?? null,
    [product, selectedVariantId]
  );

  // The API has no `variants` on the product response yet, so this normally falls back
  // to the product's own price/stock (see the fetch effect above).
  const price = selectedVariant?.price ?? product?.basePrice ?? product?.price;
  const stock = selectedVariant?.stock ?? product?.stock;
  const outOfStock = stock != null && stock <= 0;

  const handleAdd = () => {
    if (!product || outOfStock) return;
    add({
      productId: product._id,
      variantId: selectedVariant?._id ?? null,
      title: product.title,
      price,
      qty,
      vendor: product.vendorId?.storeName,
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
      <h1 className="text-2xl md:text-3xl font-extrabold">Product detail</h1>
      <p className="text-ink/60 dark:text-slate-400 mt-2">
        Gallery, variants, add-to-cart, vendor strip, reviews via products/:slug (Kernemi).
      </p>
    </section>
  );
}
