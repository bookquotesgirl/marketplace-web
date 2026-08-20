import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner } from '../components/ui';

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      api.get('/products', { params: { limit: 8, sort: 'newest' } }),
      api.get('/categories'),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (cancelled) return;
        setProducts(productsRes.data.items ?? []);
        setCategories(categoriesRes.data ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vendors = [];
  const seen = new Set();
  for (const p of products) {
    if (p.vendor && !seen.has(p.vendor.id)) {
      seen.add(p.vendor.id);
      vendors.push(p.vendor);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">Home</h1>
      <p className="text-ink/60 dark:text-slate-400 mt-2">
        Wire hero, category row, featured grid and top vendors to the products & categories API
        (Kernemi).
      </p>
    </section>
  );
}
