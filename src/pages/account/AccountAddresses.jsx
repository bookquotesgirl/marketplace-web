import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Button, Modal, Spinner, Toast } from '../../components/ui';
import AddressForm from '../../components/account/AddressForm';

export default function AccountAddresses() {
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | address object being edited
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/me/addresses')
      .then((res) => {
        if (cancelled) return;
        setAddresses(res.data.addresses ?? []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeModal = () => setModal(null);

  const handleAdd = async (values) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/me/addresses', values);
      setAddresses(data.addresses);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.patch(`/me/addresses/${modal._id}`, values);
      setAddresses(data.addresses);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(t('account.confirmDeleteAddress'))) return;
    setError('');
    try {
      const { data } = await api.delete(`/me/addresses/${address._id}`);
      setAddresses(data.addresses);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    }
  };

  const handleSetDefault = async (address) => {
    setError('');
    try {
      const { data } = await api.patch(`/me/addresses/${address._id}`, { isDefault: true });
      setAddresses(data.addresses);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? t('common.error'));
    }
  };

  if (status === 'loading') {
    return (
      <div className="py-16 grid place-items-center">
        <Spinner />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-16 text-center">
        <p className="text-ink/60 dark:text-slate-400">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">{t('account.addressesTitle')}</h2>
        <Button size="sm" onClick={() => setModal('add')}>
          {t('account.addNew')}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 shadow-soft p-8 text-center text-ink/60 dark:text-slate-400">
          {t('account.noAddresses')}
        </div>
      ) : (
        addresses.map((address) => (
          <div
            key={address._id}
            className={`bg-white dark:bg-slate-800 rounded-3xl ring-1 dark:ring-white/10 shadow-soft p-5 ${
              address.isDefault ? 'ring-2 ring-forest' : 'ring-black/5'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {{ Home: t('account.labelHome'), Office: t('account.labelOffice') }[address.label] ??
                    address.label ??
                    t('account.labelOther')}
                </span>
                {address.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-forest text-white text-[10px] font-bold">
                    {t('account.default')}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setModal(address)}
                  className="grid place-items-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label={t('account.edit')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address)}
                  className="grid place-items-center w-8 h-8 rounded-lg text-crimson hover:bg-crimson/10"
                  aria-label={t('account.delete')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm font-medium mt-3">
              {address.recipient} · {address.phone}
            </p>
            <p className="text-sm text-ink/60 dark:text-slate-400">
              {[address.line, address.subcity, address.city].filter(Boolean).join(', ')}
            </p>
            {!address.isDefault && (
              <button
                type="button"
                onClick={() => handleSetDefault(address)}
                className="mt-3 text-sm font-semibold text-forest hover:underline"
              >
                {t('account.setDefault')}
              </button>
            )}
          </div>
        ))
      )}

      <Modal
        open={Boolean(modal)}
        onClose={closeModal}
        title={modal === 'add' ? t('account.addAddressTitle') : t('account.editAddressTitle')}
      >
        {modal && (
          <AddressForm
            initial={modal === 'add' ? null : modal}
            onSubmit={modal === 'add' ? handleAdd : handleEdit}
            onCancel={closeModal}
            submitting={submitting}
          />
        )}
      </Modal>

      <Toast show={Boolean(error)}>{error}</Toast>
    </div>
  );
}
