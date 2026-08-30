import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Star } from 'lucide-react';
import api from '../lib/api';
import { mapProductCard, unwrapProductDetail, productImageUrl } from '../lib/mapProduct';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { ProductCard, ProductImage, Rating, Spinner } from '../components/ui';

function variantLabel(variant) {
  return Object.values(variant.attributes || {}).join(' / ') || variant.sku;
}

const REVIEWS_PER_PAGE = 10;

function ReviewCard({ review, t, i18n }) {
  const name = review.buyerId?.name || t('reviews.anonymous');
  const avatar = review.buyerId?.avatar;
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="py-5 border-b border-black/5 dark:border-white/10 last:border-b-0">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <span className="grid place-items-center w-10 h-10 rounded-full bg-forest/10 text-forest font-bold shrink-0">
            {name[0]?.toUpperCase() ?? '?'}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm">{name}</p>
            {review.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest bg-forest/10 rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 fill-current" />
                {t('reviews.verified')}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Rating value={review.rating} />
            {date && <span className="text-xs text-ink/50 dark:text-slate-400">{date}</span>}
          </div>
          <p className="mt-2 text-sm text-ink/80 dark:text-slate-300 whitespace-pre-line">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ t, submitting, error, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ rating, comment });
      }}
      className="mt-4 p-4 rounded-2xl ring-1 ring-black/10 dark:ring-white/15"
    >
      <p className="text-xs font-semibold text-ink/60 dark:text-slate-400 mb-2">{t('reviews.yourRating')}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            aria-label={t('reviews.starLabel', { count: s })}
            className="transition hover:scale-110"
          >
            <Star className={`w-7 h-7 ${s <= rating ? 'text-gold fill-gold' : 'text-ink/20 dark:text-white/20'}`} />
          </button>
        ))}
        <span className="ms-2 text-sm font-semibold">{rating}/5</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={4}
        placeholder={t('reviews.commentPlaceholder')}
        className="mt-3 w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-cream/40 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest resize-none text-sm"
      />
      {error && <p className="mt-2 text-sm text-crimson">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !comment.trim()}
        className="mt-3 h-11 px-6 rounded-2xl font-semibold bg-forest text-white hover:bg-forest-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? t('common.loading') : t('reviews.submit')}
      </button>
    </form>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isAuthed, user } = useAuth();
  const wishlist = useWishlist();
  const isBuyer = isAuthed && user?.role === 'buyer';

  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [reviewsStatus, setReviewsStatus] = useState('loading'); // loading | ready | error
  const [reviewPage, setReviewPage] = useState(1);

  // Eligibility comes from the buyer's own delivered orders — there's no dedicated
  // "can I review this product" endpoint, so this mirrors the backend's own check
  // (a delivered sub-order containing this product) client-side.
  const [purchased, setPurchased] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState('idle'); // idle | loading | ready

  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewPosted, setReviewPosted] = useState(false);
  // Bumped after a successful POST so the reviews effect below refetches even when the buyer
  // was already on page 1 (setReviewPage(1) alone wouldn't be a dependency change in that case).
  const [reviewsRefreshToken, setReviewsRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setProduct(null);
    setRelated([]);
    setActiveImage(0);
    setQty(1);
    setAdded(false);
    setReviewPage(1);
    setReviewPosted(false);
    setReviewError('');

    api
      .get(`/products/${slug}`)
      .then((res) => {
        if (cancelled) return;
        const p = unwrapProductDetail(res.data?.data);
        setProduct(p);
        setSelectedVariantId(p?.variants?.[0]?._id ?? null);
        setStatus('ready');
        if (p?.categoryId?._id) {
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

  // Reviews list, paginated.
  useEffect(() => {
    if (!product?._id) return undefined;
    let cancelled = false;
    setReviewsStatus('loading');
    api
      .get(`/products/${product._id}/reviews`, { params: { page: reviewPage, limit: REVIEWS_PER_PAGE } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data ?? {};
        setReviews({
          items: body.data ?? [],
          page: body.pagination?.page ?? reviewPage,
          pages: body.pagination?.pages ?? 1,
          total: body.pagination?.total ?? (body.data ?? []).length,
        });
        setReviewsStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setReviewsStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [product?._id, reviewPage, reviewsRefreshToken]);

  // Purchase eligibility for the "write a review" form.
  useEffect(() => {
    if (!product?._id || !isBuyer) {
      setPurchased(false);
      setEligibilityStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setEligibilityStatus('loading');
    api
      .get('/orders')
      .then((res) => {
        if (cancelled) return;
        const orders = res.data?.orders ?? [];
        const hasDeliveredPurchase = orders.some((order) =>
          (order.subOrders ?? []).some(
            (sub) =>
              sub.status === 'delivered' &&
              (sub.items ?? []).some((item) => String(item.productId) === String(product._id))
          )
        );
        setPurchased(hasDeliveredPurchase);
        setEligibilityStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setEligibilityStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [product?._id, isBuyer]);

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

  const handleToggleWishlist = () => {
    if (!product) return;
    if (!wishlist.isBuyer) {
      navigate('/login');
      return;
    }
    wishlist.toggle(product._id).catch(() => {});
  };

  const handleSubmitReview = ({ rating, comment }) => {
    if (!product) return;
    setReviewSubmitting(true);
    setReviewError('');
    api
      .post(`/products/${product._id}/reviews`, { rating, comment })
      .then(() => {
        setReviewPosted(true);
        setReviewPage(1);
        setReviewsRefreshToken((n) => n + 1);
        // Refresh the product's denormalized rating/reviewCount shown above the fold.
        api
          .get(`/products/${slug}`)
          .then((res) => {
            const p = unwrapProductDetail(res.data?.data);
            if (p) setProduct((prev) => (prev ? { ...prev, rating: p.rating, reviewCount: p.reviewCount } : prev));
          })
          .catch(() => {});
      })
      .catch((err) => {
        setReviewError(err.response?.data?.error?.message || t('common.error'));
      })
      .finally(() => setReviewSubmitting(false));
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

  const wishlisted = wishlist.has(product._id);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {(() => {
            const images = (product.images ?? []).map(productImageUrl).filter(Boolean);
            return (
              <>
                <div className="aspect-square rounded-2xl overflow-hidden bg-black/5">
                  <ProductImage src={images[activeImage]} alt={product.title} className="text-6xl" />
                </div>
                {images.length > 1 && (
                  <div className="mt-3 flex gap-2">
                    {images.map((img, i) => (
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
              </>
            );
          })()}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            {product.vendorId &&
              (product.vendorId.slug ? (
                <Link to={`/store/${product.vendorId.slug}`} className="text-sm font-semibold text-forest hover:underline">
                  {product.vendorId.storeName}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-forest">{product.vendorId.storeName}</span>
              ))}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={t(wishlisted ? 'common.removeFromWishlist' : 'common.addToWishlist')}
              aria-pressed={wishlisted}
              className={`grid place-items-center w-10 h-10 rounded-xl ring-1 shrink-0 transition active:scale-90 ${
                wishlisted
                  ? 'bg-crimson text-white ring-crimson'
                  : 'ring-black/10 dark:ring-white/15 text-ink/60 dark:text-slate-300 hover:text-crimson'
              }`}
            >
              <Heart className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">{product.title}</h1>
          <div className="mt-2">
            <a href="#reviews" className="inline-block hover:opacity-80">
              <Rating value={product.rating} count={product.reviewCount} />
            </a>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">
            {product.currency} {Number(price).toLocaleString()}
          </p>

          {/* "Show stock levels" (Day 11 — Store Settings) only hides the remaining-quantity
              count; out-of-stock still always shows since buyers need that either way. */}
          {stock != null && (outOfStock || product.vendorId?.showStockLevels !== false) && (
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
                  key={v._id}
                  onClick={() => {
                    setSelectedVariantId(v._id);
                    setQty(1);
                  }}
                  disabled={v.stock <= 0}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ring-1 transition disabled:opacity-40 disabled:cursor-not-allowed
                    ${v._id === selectedVariantId ? 'bg-forest text-white ring-forest' : 'ring-black/10 hover:ring-forest'}`}
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
                max={stock != null ? Math.max(stock, 1) : undefined}
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

      <div id="reviews" className="mt-16 scroll-mt-24 max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold">
            {t('reviews.title')} {product.reviewCount ? `(${product.reviewCount})` : ''}
          </h2>
          <Rating value={product.rating} />
        </div>

        <div className="mt-4">
          {!isAuthed && (
            <p className="text-sm text-ink/60 dark:text-slate-400">
              <Link to="/login" className="text-forest font-semibold hover:underline">
                {t('reviews.loginToReview')}
              </Link>
            </p>
          )}
          {isAuthed && !isBuyer && (
            <p className="text-sm text-ink/60 dark:text-slate-400">{t('reviews.buyersOnly')}</p>
          )}
          {isBuyer && eligibilityStatus === 'loading' && (
            <div className="py-2">
              <Spinner />
            </div>
          )}
          {isBuyer && eligibilityStatus === 'ready' && !purchased && (
            <p className="text-sm text-ink/60 dark:text-slate-400">{t('reviews.purchaseHint')}</p>
          )}
          {isBuyer && eligibilityStatus === 'ready' && purchased && !reviewPosted && (
            <ReviewForm t={t} submitting={reviewSubmitting} error={reviewError} onSubmit={handleSubmitReview} />
          )}
          {reviewPosted && <p className="text-sm text-forest font-semibold">{t('reviews.thanks')}</p>}
        </div>

        <div className="mt-6">
          {reviewsStatus === 'loading' && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {reviewsStatus === 'error' && (
            <p className="py-6 text-center text-crimson">{t('common.error')}</p>
          )}
          {reviewsStatus === 'ready' && reviews.items.length === 0 && (
            <p className="py-6 text-ink/60 dark:text-slate-400">{t('reviews.empty')}</p>
          )}
          {reviewsStatus === 'ready' &&
            reviews.items.map((r) => <ReviewCard key={r._id} review={r} t={t} i18n={i18n} />)}

          {reviewsStatus === 'ready' && reviews.pages > 1 && (
            <nav
              aria-label={t('browse.pageOf', { page: reviews.page, pages: reviews.pages })}
              className="flex items-center justify-center gap-1.5 mt-6"
            >
              <button
                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                disabled={reviews.page <= 1}
                aria-label={t('browse.prevPage')}
                className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
              >
                ‹
              </button>
              {Array.from({ length: reviews.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewPage(n)}
                  aria-current={n === reviews.page ? 'page' : undefined}
                  className={`grid place-items-center w-10 h-10 rounded-xl font-semibold transition ${
                    n === reviews.page
                      ? 'bg-forest text-white'
                      : 'ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setReviewPage((p) => Math.min(reviews.pages, p + 1))}
                disabled={reviews.page >= reviews.pages}
                aria-label={t('browse.nextPage')}
                className="grid place-items-center w-10 h-10 rounded-xl ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl md:text-2xl font-extrabold">{t('product.related')}</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard
                key={p._id}
                product={mapProductCard(p)}
                wishlisted={wishlist.has(p._id)}
                onToggleWishlist={() => {
                  if (!wishlist.isBuyer) {
                    navigate('/login');
                    return;
                  }
                  wishlist.toggle(p._id).catch(() => {});
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
