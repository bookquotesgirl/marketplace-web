import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders';
import Header from './Header';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import '../i18n/i18n';

beforeEach(() => {
  useCartStore.getState().clear();
  useUiStore.setState({ language: 'en', dark: false });
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
});
