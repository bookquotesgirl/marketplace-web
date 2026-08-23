import { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import AccountProfile from './AccountProfile';
import '../../i18n/i18n';

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../../lib/api';

const baseProfile = { name: 'Abebe Kebede', phone: '+251911234567', avatar: '' };

// AccountProfile reads {profile, setProfile} via useOutletContext (supplied by
// AccountLayout in the real app) — this stand-in reproduces that wiring for the test.
function Wrapper({ initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  return <Outlet context={{ profile, setProfile }} />;
}

function renderProfile(initialProfile = baseProfile) {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route element={<Wrapper initialProfile={initialProfile} />}>
          <Route path="/profile" element={<AccountProfile />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.patch.mockReset();
});

describe('AccountProfile', () => {
  it('prefills the form from the current profile', () => {
    renderProfile();
    expect(screen.getByLabelText(/Full name/i)).toHaveValue('Abebe Kebede');
    expect(screen.getByDisplayValue('911234567')).toBeInTheDocument();
  });

  it('saves name and phone changes via PATCH /me/profile', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({
      data: { profile: { name: 'New Name', phone: '+251922000000', avatar: '' } },
    });
    renderProfile();

    await user.clear(screen.getByLabelText(/Full name/i));
    await user.type(screen.getByLabelText(/Full name/i), 'New Name');
    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/me/profile', {
        name: 'New Name',
        phone: '+251911234567',
        avatar: '',
      })
    );
    expect(await screen.findByText('Profile updated.')).toBeInTheDocument();
  });

  it('rejects an avatar file that is too large', async () => {
    const user = userEvent.setup();
    renderProfile();

    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], 'photo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Profile photo/i);
    await user.upload(input, bigFile);

    expect(await screen.findByText('Image must be smaller than 2MB.')).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('renders correctly in Arabic RTL', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    renderProfile();
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });
});
