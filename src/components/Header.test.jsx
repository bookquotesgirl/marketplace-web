import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders';
import Header from './Header';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import '../i18n/i18n';

beforeEach(() => {
  useCartStore.getState().clear();
  useUiStore.setState({ language: 'en', dark: false });
  useAuthStore.setState({ user: null, token: null });
});

describe('Header', () => {
  it('shows the cart item count from cartStore', () => {
    useCartStore
      .getState()
      .add({ productId: 'p1', variantId: null, title: 'Phone', price: 100, qty: 2 });
    renderWithProviders(<Header />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides the cart badge when the cart is empty', () => {
    renderWithProviders(<Header />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('submits the search box to /browse with a q param', async () => {
    const user = userEvent.setup();
    function BrowseProbe() {
      const location = useLocation();
      return <p>browse:{location.search}</p>;
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/browse" element={<BrowseProbe />} />
        </Routes>
      </MemoryRouter>
    );
    const inputs = screen.getAllByPlaceholderText('Search products, brands & vendors…');
    await user.type(inputs[0], 'coffee');
    await user.click(screen.getAllByLabelText('Search products, brands & vendors…')[0]);
    expect(await screen.findByText('browse:?q=coffee')).toBeInTheDocument();
  });

  it('shows "Sign in" for a guest, linking to /login', () => {
    renderWithProviders(<Header />);
    const link = screen.getByRole('link', { name: 'Sign in' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it("shows the signed-in user's name, linking to /profile", () => {
    useAuthStore.setState({ user: { name: 'Abebe Kebede', role: 'buyer' }, token: 'tok' });
    renderWithProviders(<Header />);
    const link = screen.getByRole('link', { name: /Abebe Kebede/ });
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('renders the avatar data URL as-is (no API origin prepended)', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    useAuthStore.setState({
      user: { name: 'Abebe Kebede', role: 'buyer', avatar: dataUrl },
      token: 'tok',
    });
    renderWithProviders(<Header />);
    expect(document.querySelector('img')).toHaveAttribute('src', dataUrl);
  });

  it('falls back to the initial disc when the avatar image fails to load', () => {
    useAuthStore.setState({
      user: { name: 'Abebe Kebede', role: 'buyer', avatar: 'https://example.test/dead.png' },
      token: 'tok',
    });
    renderWithProviders(<Header />);
    fireEvent.error(document.querySelector('img'));
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('opens the notifications popover and closes it on Escape', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const bell = screen.getByRole('button', { name: 'Notifications' });
    expect(bell).toHaveAttribute('aria-expanded', 'false');

    await user.click(bell);
    expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument();
  });
});
