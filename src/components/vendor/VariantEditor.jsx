import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';

// Matches the real Variant schema: attributes.size / attributes.colour (+ price/stock), one
// row per variant — not a Shopify-style option/value generator, since that's not what the
// backend stores.
const cellInputCls =
  'w-full px-2.5 py-2 rounded-lg ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-forest text-sm';

export default function VariantEditor({ variants, onChange }) {
  const { t } = useTranslation();

  const updateField = (idx, patch) =>
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const updateAttr = (idx, key, value) =>
    onChange(
      variants.map((v, i) =>
        i === idx ? { ...v, attributes: { ...v.attributes, [key]: value } } : v
      )
    );

  const remove = (idx) => onChange(variants.filter((_, i) => i !== idx));

  const add = () =>
    onChange([...variants, { attributes: { size: '', colour: '' }, price: '', stock: '' }]);

  return (
    <div>
      {variants.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-ink/40 dark:text-slate-500 text-[11px] uppercase tracking-wide">
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.form.variantSize')}</th>
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.form.variantColour')}</th>
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.price')}</th>
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.stock')}</th>
                <th className="py-2 px-1 w-9" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={v._id ?? `new-${i}`} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-2 px-1">
                    <input
                      value={v.attributes?.size ?? ''}
                      onChange={(e) => updateAttr(i, 'size', e.target.value)}
                      placeholder={t('vendor.products.form.variantSizePlaceholder')}
                      className={cellInputCls}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      value={v.attributes?.colour ?? ''}
                      onChange={(e) => updateAttr(i, 'colour', e.target.value)}
                      placeholder={t('vendor.products.form.variantColourPlaceholder')}
                      className={cellInputCls}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price}
                      onChange={(e) => updateField(i, { price: e.target.value })}
                      className={`${cellInputCls} w-24`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={v.stock}
                      onChange={(e) => updateField(i, { stock: e.target.value })}
                      className={`${cellInputCls} w-20`}
                    />
                  </td>
                  <td className="py-2 px-1 text-end">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={t('vendor.products.delete')}
                      className="grid place-items-center w-8 h-8 rounded-lg hover:bg-crimson/10 text-crimson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
      >
        <Plus className="w-4 h-4" />
        {t('vendor.products.form.addVariant')}
      </button>
    </div>
  );
}
