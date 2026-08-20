import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { mapProductCard } from '../lib/mapProduct';
import { ProductCard, Spinner, Select } from '../components/ui';

export default function Browse() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get('/products', { params: { category: category || undefined, page, limit: 12 } })
      .then((res) => {
        if (cancelled) return;
        setResult(res.data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [category, page]);

  const setCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    next.set('page', '1');
    setSearchParams(next);
  };

  const setPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">Browse</h1>
      <p className="text-ink/60 dark:text-slate-400 mt-2">
        Product grid with category filter and pagination from the API (Kernemi).
      </p>
    </section>
  );
}
