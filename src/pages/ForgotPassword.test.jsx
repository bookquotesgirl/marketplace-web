import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import '../i18n/i18n';

vi.mock('../lib/api', () => ({
  default: { post: vi.fn() },
}));
import api from '../lib/api';

function ResetPasswordProbe() {
  const location = useLocation();
  return <p>state:{JSON.stringify(location.state)}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.post.mockReset();
});

describe('ForgotPassword', () => {
  it('requests a reset code and navigates to reset-password with the phone', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { message: 'ok' } });
    renderPage();

    await user.type(screen.getByPlaceholderText('911 234 567'), '911234567');
    await user.click(screen.getByRole('button', { name: /Send code/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { phone: '+251911234567' }));
    expect(await screen.findByText(/"phone":"\+251911234567"/)).toBeInTheDocument();
  });

  it('carries the dev-stub code through router state when the API echoes it', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { message: 'ok', code: '123456' } });
    renderPage();

    await user.type(screen.getByPlaceholderText('911 234 567'), '911234567');
    await user.click(screen.getByRole('button', { name: /Send code/i }));

    expect(await screen.findByText(/"devCode":"123456"/)).toBeInTheDocument();
  });

  it('shows an API error', async () => {
    const user = userEvent.setup();
    const err = new Error('fail');
    err.response = { data: { error: { message: 'Something went wrong.' } } };
    api.post.mockRejectedValue(err);
    renderPage();

    await user.type(screen.getByPlaceholderText('911 234 567'), '911234567');
    await user.click(screen.getByRole('button', { name: /Send code/i }));

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders correctly in Arabic RTL', () => {
    document.documentElement.dir = 'rtl';
    renderPage();
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
  });
});
