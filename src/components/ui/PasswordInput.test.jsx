import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './PasswordInput';
import { useApplyLanguage } from '../../hooks/useApplyLanguage';
import { useUiStore } from '../../store/uiStore';
import '../../i18n/i18n';

function Harness(props) {
  useApplyLanguage();
  return <PasswordInput label="Password" {...props} />;
}

beforeEach(() => {
  useUiStore.setState({ language: 'en', dark: false });
  document.documentElement.dir = 'ltr';
});

describe('PasswordInput', () => {
  it('hides the value by default and reveals it when the eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('reflects toggle state via aria-pressed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('localises the toggle label and mirrors to RTL in Arabic', async () => {
    useUiStore.setState({ language: 'ar', dark: false });
    render(<Harness />);
    expect(document.documentElement.dir).toBe('rtl');
    expect(await screen.findByRole('button', { name: 'إظهار كلمة المرور' })).toBeInTheDocument();
  });
});
