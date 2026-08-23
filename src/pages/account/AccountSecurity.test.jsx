import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSecurity from './AccountSecurity';
import '../../i18n/i18n';

vi.mock('../../lib/api', () => ({
  default: { patch: vi.fn() },
}));
import api from '../../lib/api';

beforeEach(() => {
  api.patch.mockReset();
});

async function fillForm(user, { current = 'oldpass1', next = 'newpass123', confirm = 'newpass123' } = {}) {
  await user.type(screen.getByLabelText(/Current password/i), current);
  await user.type(screen.getByLabelText(/^New password$/i), next);
  await user.type(screen.getByLabelText(/Confirm new password/i), confirm);
}

describe('AccountSecurity', () => {
  it('changes the password via PATCH /me/change-password', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({ data: { success: true } });
    render(<AccountSecurity />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Change password/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/me/change-password', {
        currentPassword: 'oldpass1',
        newPassword: 'newpass123',
      })
    );
    expect(await screen.findByText('Password updated successfully.')).toBeInTheDocument();
  });

  it('blocks submit when the new password is too short', async () => {
    const user = userEvent.setup();
    render(<AccountSecurity />);

    await fillForm(user, { next: 'short', confirm: 'short' });
    await user.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('shows a friendly message when the current password is wrong (401)', async () => {
    const user = userEvent.setup();
    const err = new Error('fail');
    err.response = { status: 401 };
    api.patch.mockRejectedValue(err);
    render(<AccountSecurity />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });

  it('renders correctly in Arabic RTL', () => {
    document.documentElement.dir = 'rtl';
    render(<AccountSecurity />);
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = 'ltr';
  });
});
