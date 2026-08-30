import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import api from '../../lib/api';

// Real uploads only — POST /api/uploads (multipart, field "file") requires a productId and
// pushes straight onto that product's images[] server-side (see API mapping notes in
// PROGRESS.md). `ensureProductId` lets the form create a draft product on first use if the
// vendor hasn't saved anything yet, so "upload a photo" works from a blank Add Product page.
const MAX_IMAGES = 6;
const MAX_PER_REQUEST = 5;

export default function MediaUploader({ images, onChange, ensureProductId }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removingKey, setRemovingKey] = useState(null);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const selected = files.slice(0, Math.min(remaining, MAX_PER_REQUEST));

    setError('');
    setUploading(true);
    try {
      const productId = await ensureProductId();
      const form = new FormData();
      selected.forEach((f) => form.append('file', f));
      form.append('productId', productId);
      const { data } = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...images, ...(data.images ?? [])]);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ?? t('vendor.products.form.uploadError')
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = async (img) => {
    setError('');
    setRemovingKey(img.key);
    try {
      const productId = await ensureProductId();
      await api.delete('/uploads', { data: { productId, key: img.key } });
      onChange(images.filter((i) => i.key !== img.key));
    } catch (err) {
      setError(
        err.response?.data?.error?.message ?? t('vendor.products.form.uploadError')
      );
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.key ?? img.url ?? i}
            className="relative w-24 h-24 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/15 group shrink-0"
          >
            {i === 0 && (
              <span className="absolute top-1 start-1 z-10 px-1.5 py-0.5 rounded-md bg-forest text-white text-[10px] font-bold">
                {t('vendor.products.form.cover')}
              </span>
            )}
            <img src={img.url} alt="" className="w-full h-full object-cover bg-black/5 dark:bg-white/5" />
            <button
              type="button"
              onClick={() => removeImage(img)}
              disabled={removingKey === img.key}
              aria-label={t('common.remove')}
              className="absolute top-1 end-1 grid place-items-center w-6 h-6 rounded-full bg-ink/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition disabled:opacity-100"
            >
              {removingKey === img.key ? '…' : <X className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-black/15 dark:border-white/20 grid place-items-center gap-1 text-ink/40 dark:text-slate-500 hover:border-forest/40 hover:text-forest transition disabled:opacity-50 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[11px] font-semibold">
              {uploading ? t('common.loading') : t('vendor.products.form.addPhoto')}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-crimson mt-2">{error}</p>}
    </div>
  );
}
