import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountProfile from './AccountProfile';
import AccountAddresses from './AccountAddresses';
import '../../i18n/i18n';

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../../lib/api';

const profile = { name: 'Abebe Kebede', phone: '+251911234567', avatar: '', isPhoneVerified: true };

function renderLayout(route = '/profile') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/profile" element={<AccountLayout />}>
          <Route index element={<AccountProfile />} />
          <Route path="addresses" element={<AccountAddresses />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
});

describe('AccountLayout', () => {
  it('loads the profile and shows the verified badge and default (Profile) tab', async () => {
    api.get.mockResolvedValue({ data: { profile } });
    renderLayout();

    expect(await screen.findByText('Abebe Kebede')).toBeInTheDocument();
    expect(screen.getByText('Phone verified')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toHaveValue('Abebe Kebede');
  });

  it('navigates to the Addresses tab', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) =>
      url === '/me/profile' ? Promise.resolve({ data: { profile } }) : Promise.resolve({ data: { addresses: [] } })
    );
    renderLayout();

    await screen.findByText('Abebe Kebede');
    await user.click(screen.getByRole('link', { name: 'Addresses' }));

    expect(await screen.findByText("You haven't saved any addresses yet.")).toBeInTheDocument();
  });

  it('shows an error state when the profile fetch fails', async () => {
    api.get.mockRejectedValue(new Error('fail'));
    renderLayout();
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders correctly in Arabic RTL', async () => {
    document.documentElement.dir = 'rtl';
    api.get.mockResolvedValue({ data: { profile } });
    renderLayout();
    await screen.findByText('Abebe Kebede');
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
  });
});
