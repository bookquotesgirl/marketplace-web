import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '../ui';

// Shared by AccountAddresses (add + edit) — mirrors the User.addresses schema exactly:
// { label, recipient, phone, region, city, subcity, line, isDefault }.
function stripPhonePrefix(value) {
  let val = (value || '').trim();
  if (val.startsWith('+251')) val = val.slice(4);
  else if (val.startsWith('251')) val = val.slice(3);
  else if (val.startsWith('0')) val = val.slice(1);
  return val;
}

export default function AddressForm({ initial, onSubmit, onCancel, submitting }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    label: initial?.label || 'Home',
    recipient: initial?.recipient || '',
    phone: stripPhonePrefix(initial?.phone),
    region: initial?.region || '',
    city: initial?.city || '',
    subcity: initial?.subcity || '',
    line: initial?.line || '',
    isDefault: initial?.isDefault || false,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoneChange = (e) => setForm((f) => ({ ...f, phone: stripPhonePrefix(e.target.value) }));

  const validate = () => {
    const errors = {};
    if (!form.recipient.trim()) errors.recipient = t('checkout.required');
    if (!form.phone.trim()) errors.phone = t('checkout.required');
    else if (!/^[79]\d{8}$/.test(form.phone.trim())) errors.phone = t('checkout.invalidPhone');
    if (!form.city.trim()) errors.city = t('checkout.required');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      label: form.label,
      recipient: form.recipient.trim(),
      phone: '+251' + form.phone.trim(),
      region: form.region.trim(),
      city: form.city.trim(),
      subcity: form.subcity.trim(),
      line: form.line.trim(),
      isDefault: form.isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Select label={t('account.label')} value={form.label} onChange={set('label')}>
        <option value="Home">{t('account.labelHome')}</option>
        <option value="Office">{t('account.labelOffice')}</option>
        <option value="Other">{t('account.labelOther')}</option>
      </Select>

      <div>
        <Input
          label={t('account.recipient')}
          value={form.recipient}
          onChange={set('recipient')}
          aria-invalid={Boolean(fieldErrors.recipient)}
        />
        {fieldErrors.recipient && <p className="mt-1 text-xs text-crimson">{fieldErrors.recipient}</p>}
      </div>

      <div>
        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('checkout.phone')}
          </span>
          <div className="flex rounded-xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-white dark:bg-slate-800 overflow-hidden">
            <span className="grid place-items-center px-3 text-sm text-ink/60 dark:text-slate-400 border-e border-black/10 dark:border-white/10 shrink-0">
              +251
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder={t('checkout.phonePlaceholder')}
              aria-invalid={Boolean(fieldErrors.phone)}
              className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none dark:text-slate-100"
            />
          </div>
        </label>
        {fieldErrors.phone && <p className="mt-1 text-xs text-crimson">{fieldErrors.phone}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label={t('account.region')} value={form.region} onChange={set('region')} />
        <div>
          <Input
            label={t('checkout.city')}
            value={form.city}
            onChange={set('city')}
            aria-invalid={Boolean(fieldErrors.city)}
          />
          {fieldErrors.city && <p className="mt-1 text-xs text-crimson">{fieldErrors.city}</p>}
        </div>
      </div>

      <Input label={t('account.subcity')} value={form.subcity} onChange={set('subcity')} />
      <Input label={t('account.line')} value={form.line} onChange={set('line')} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="accent-forest w-4 h-4"
        />
        {t('account.setDefault')}
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? t('account.saving') : t('account.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t('account.cancel')}
        </Button>
      </div>
    </form>
  );
}
