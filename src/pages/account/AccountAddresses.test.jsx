import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AccountAddresses from './AccountAddresses';
import '../../i18n/i18n';

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
import api from '../../lib/api';

const homeAddress = {
  _id: 'addr-1',
  label: 'Home',
  recipient: 'Abebe Kebede',
  phone: '+251911234567',
  city: 'Addis Ababa',
  line: 'Bole, near Edna Mall',
  isDefault: true,
};

function renderAddresses() {
  return render(
    <MemoryRouter>
      <AccountAddresses />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.patch.mockReset();
  api.delete.mockReset();
  window.confirm = vi.fn(() => true);
});

describe('AccountAddresses', () => {
  it('shows the empty state when there are no saved addresses', async () => {
    api.get.mockResolvedValue({ data: { addresses: [] } });
    renderAddresses();
    expect(await screen.findByText("You haven't saved any addresses yet.")).toBeInTheDocument();
  });

  it('lists saved addresses with the default badge', async () => {
    api.get.mockResolvedValue({ data: { addresses: [homeAddress] } });
    renderAddresses();
    expect(await screen.findByText(/Abebe Kebede/)).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('adds a new address through the shared form', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { addresses: [] } });
    api.post.mockResolvedValue({ data: { addresses: [homeAddress] } });
    renderAddresses();

    await screen.findByText("You haven't saved any addresses yet.");
    await user.click(screen.getByRole('button', { name: /Add new/i }));

    const dialog = screen.getByText('Add address').closest('div');
    await user.type(within(dialog).getByLabelText(/Recipient name/i), 'Abebe Kebede');
    await user.type(within(dialog).getByPlaceholderText('911 234 567'), '911234567');
    await user.type(within(dialog).getByLabelText(/^City$/i), 'Addis Ababa');

    await user.click(within(dialog).getByRole('button', { name: /Save changes/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/me/addresses',
        expect.objectContaining({ recipient: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa' })
      )
    );
    expect(await screen.findByText(/Abebe Kebede/)).toBeInTheDocument();
  });

  it('deletes an address after confirming', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { addresses: [homeAddress] } });
    api.delete.mockResolvedValue({ data: { addresses: [] } });
    renderAddresses();

    await screen.findByText(/Abebe Kebede/);
    await user.click(screen.getByRole('button', { name: /Delete/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/me/addresses/addr-1'));
    expect(await screen.findByText("You haven't saved any addresses yet.")).toBeInTheDocument();
  });

  it('renders correctly in Arabic RTL', async () => {
    document.documentElement.dir = 'rtl';
    api.get.mockResolvedValue({ data: { addresses: [homeAddress] } });
    renderAddresses();
    await screen.findByText(/Abebe Kebede/);
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
  });
});
