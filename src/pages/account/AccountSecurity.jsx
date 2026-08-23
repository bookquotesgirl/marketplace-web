import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Button, Toast } from '../../components/ui';

export default function AccountSecurity() {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (newPassword.length < 8) {
      setError(t('auth.weakPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSaving(true);
    try {
      await api.patch('/me/change-password', { currentPassword, newPassword });
      resetForm();
      setSaved(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError(t('account.currentPasswordIncorrect'));
      else setError(err.response?.data?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-5 md:p-6 max-w-md">
      <h2 className="font-extrabold text-lg">{t('account.securityTitle')}</h2>
      <p className="text-sm text-ink/60 dark:text-slate-400 mt-1">{t('account.changePassword')}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('account.currentPassword')}
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.newPassword')}
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-ink/60 dark:text-slate-400 mb-1.5">
            {t('auth.confirmNewPassword')}
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            className="w-full px-3.5 py-3 rounded-xl ring-1 ring-black/10 dark:ring-white/15 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        {error && (
          <p className="text-sm text-crimson font-medium" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? t('account.saving') : t('account.changePassword')}
        </Button>
      </form>

      <Toast show={saved}>{t('account.passwordUpdated')}</Toast>
    </div>
  );
}
