import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

// Shopify-style "option + values" editor: one option name (e.g. "Color") + chip values
// (Black, White, ...), each value becoming one variant row with its own price/stock.
// `Variant.attributes` on the backend is a free-form option-name -> value map (Day 11), so the
// option name typed here is stored verbatim rather than forced into a fixed size/colour shape.
const cellInputCls =
  'w-full px-2.5 py-2 rounded-lg ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-forest text-sm';

export default function VariantEditor({ optionName, onOptionNameChange, rows, onRowsChange }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const addValue = () => {
    const value = draft.trim();
    if (!value) return;
    if (rows.some((r) => r.value.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onRowsChange([...rows, { value, price: '', stock: '' }]);
    setDraft('');
  };

  const removeValue = (value) => onRowsChange(rows.filter((r) => r.value !== value));

  const updateRow = (value, patch) =>
    onRowsChange(rows.map((r) => (r.value === value ? { ...r, ...patch } : r)));

  return (
    <div>
      <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/15 p-4">
        <div className="flex items-center gap-2">
          <input
            value={optionName}
            onChange={(e) => onOptionNameChange(e.target.value)}
            placeholder={t('vendor.products.form.optionNamePlaceholder')}
            className={cellInputCls}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {rows.map((r) => (
            <span
              key={r.value}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-forest/10 text-forest text-sm font-semibold"
            >
              {r.value}
              <button
                type="button"
                onClick={() => removeValue(r.value)}
                aria-label={t('common.remove')}
                className="grid place-items-center w-4 h-4 rounded-full hover:bg-forest/20"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addValue();
              }
            }}
            onBlur={addValue}
            placeholder={t('vendor.products.form.addValuePlaceholder')}
            className="flex-1 min-w-[120px] px-2 py-1 text-sm bg-transparent outline-none placeholder:text-ink/40 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto mt-4 -mx-1">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-ink/40 dark:text-slate-500 text-[11px] uppercase tracking-wide">
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.form.variantCol')}</th>
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.price')}</th>
                <th className="text-start font-semibold py-2 px-1">{t('vendor.products.stock')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.value} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-2 px-1 font-medium">{r.value}</td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={r.price}
                      onChange={(e) => updateRow(r.value, { price: e.target.value })}
                      className={`${cellInputCls} w-28`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={r.stock}
                      onChange={(e) => updateRow(r.value, { stock: e.target.value })}
                      className={`${cellInputCls} w-24`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
