import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import '../i18n/i18n';

vi.mock('../lib/api', () => ({
  default: { post: vi.fn() },
}));
import api from '../lib/api';

function LoginProbe() {
  const location = useLocation();
  return <p>at:/login state:{JSON.stringify(location.state)}</p>;
}

function renderPage(state = { phone: '+251911234567', devCode: '123456' }) {
  const entry = state ? { pathname: '/reset-password', state } : '/reset-password';
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.post.mockReset();
});

describe('ResetPassword', () => {
  it('shows the dev-stub code when the router state carries one', () => {
    renderPage();
    expect(screen.getByText('123456')).toBeInTheDocument();
  });

  it('validates the new password before submitting', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('••••••'), '111111');
    await user.type(screen.getByLabelText(/^New password$/i), 'short');
    await user.type(screen.getByLabelText(/Confirm new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /Verify & continue/i }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('validates that the two password fields match', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('••••••'), '111111');
    await user.type(screen.getByLabelText(/^New password$/i), 'longenough1');
    await user.type(screen.getByLabelText(/Confirm new password/i), 'longenough2');
    await user.click(screen.getByRole('button', { name: /Verify & continue/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('resets the password and navigates to login on success', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { message: 'ok' } });
    renderPage();

    await user.type(screen.getByPlaceholderText('••••••'), '111111');
    await user.type(screen.getByLabelText(/^New password$/i), 'longenough1');
    await user.type(screen.getByLabelText(/Confirm new password/i), 'longenough1');
    await user.click(screen.getByRole('button', { name: /Verify & continue/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        phone: '+251911234567',
        code: '111111',
        newPassword: 'longenough1',
      })
    );
    expect(await screen.findByText(/at:\/login/)).toBeInTheDocument();
  });

  it('shows INVALID_RESET_CODE errors from the API', async () => {
    const user = userEvent.setup();
    const err = new Error('fail');
    err.response = { data: { error: { code: 'INVALID_RESET_CODE' } } };
    api.post.mockRejectedValue(err);
    renderPage();

    await user.type(screen.getByPlaceholderText('••••••'), '111111');
    await user.type(screen.getByLabelText(/^New password$/i), 'longenough1');
    await user.type(screen.getByLabelText(/Confirm new password/i), 'longenough1');
    await user.click(screen.getByRole('button', { name: /Verify & continue/i }));

    expect(await screen.findByText('The reset code is invalid or has expired.')).toBeInTheDocument();
  });

  it('asks for a phone number when arriving without router state', () => {
    renderPage(null);
    expect(screen.getByPlaceholderText('911 234 567')).toBeInTheDocument();
  });

  it('renders correctly in Arabic RTL', () => {
    document.documentElement.dir = 'rtl';
    renderPage();
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
  });
});
