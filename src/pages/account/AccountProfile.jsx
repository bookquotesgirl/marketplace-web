import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Toast } from '../../components/ui';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png'];

function stripPhonePrefix(value) {
  let val = (value || '').trim();
  if (val.startsWith('+251')) val = val.slice(4);
  else if (val.startsWith('251')) val = val.slice(3);
  else if (val.startsWith('0')) val = val.slice(1);
  return val;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AccountProfile() {
  const { t } = useTranslation();
  const { profile, setProfile } = useOutletContext();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(stripPhonePrefix(profile.phone));
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handlePhoneChange = (e) => setPhone(stripPhonePrefix(e.target.value));

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError(t('account.avatarInvalidType'));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t('account.avatarTooLarge'));
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setAvatar(dataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const { data } = await api.patch('/me/profile', {
        name: name.trim(),
        phone: '+251' + phone.trim(),
        avatar,
      });
      setProfile(data.profile);
      // Keep the in-memory auth user (used by the header avatar) in sync.
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setAuth({
          user: { ...authUser, name: data.profile.name, avatar: data.profile.avatar },
          token: useAuthStore.getState().token,
        });
      }
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6">
      <h2 className="font-extrabold text-lg">{t('account.profileTitle')}</h2>
      <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">{t('account.profileSub')}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-md">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <span className="grid place-items-center w-16 h-16 rounded-full bg-forest/10 text-forest font-extrabold text-xl">
              {(name || '?')[0]?.toUpperCase()}
            </span>
          )}
          <div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('account.changePhoto')}
              </Button>
              {avatar && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar('')}>
                  {t('account.removePhoto')}
                </Button>
              )}
            </div>
            <p className="text-xs text-ink/50 dark:text-slate-400 mt-1.5">
              {t('account.avatarHint')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
              aria-label={t('account.avatar')}
            />
          </div>
        </div>

        <Input
          label={t('auth.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.phone')}
          </span>
          <div className="flex rounded-xl ring-1 ring-black/10 dark:ring-white/15 focus-within:ring-2 focus-within:ring-forest bg-white dark:bg-slate-800 overflow-hidden">
            <span className="grid place-items-center px-3 text-sm text-ink/60 dark:text-slate-400 border-e border-black/10 dark:border-white/10 shrink-0">
              +251
            </span>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t('checkout.phonePlaceholder')}
              className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none dark:text-slate-100"
            />
          </div>
        </label>

        {error && (
          <p className="text-sm text-crimson font-medium" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? t('account.saving') : t('account.save')}
        </Button>
      </form>

      <Toast show={saved}>{t('account.profileSaved')}</Toast>
    </div>
  );
}
