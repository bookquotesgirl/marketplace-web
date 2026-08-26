import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '../i18n/i18n';
import Wishlist from './Wishlist';
import { useCartStore } from '../store/cartStore';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const ITEMS = [
  { productId: { _id: 'p1', title: 'Phone Case', price: 500, stock: 5 } },
  { productId: { _id: 'p2', title: 'Sold Out Charger', price: 300, stock: 0 } },
];

function renderWishlist() {
  render(
    <MemoryRouter initialEntries={['/wishlist']}>
      <Routes>
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/browse" element={<p>at:/browse</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useCartStore.getState().clear();
  api.get.mockReset();
  api.delete.mockReset();
  i18n.changeLanguage('en');
});

describe('Wishlist', () => {
  it('shows the empty state with a link to browse when there are no saved items', async () => {
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: [] } } });
    renderWishlist();

    expect(await screen.findByText('Your wishlist is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/browse');
  });

  it('lists saved items with their price and an out-of-stock label', async () => {
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: ITEMS } } });
    renderWishlist();

    expect(await screen.findByText('Phone Case')).toBeInTheDocument();
    expect(screen.getByText('ETB 500')).toBeInTheDocument();
    expect(screen.getByText('Sold Out Charger')).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));
    renderWishlist();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('removes an item via the heart button', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: ITEMS } } });
    api.delete.mockResolvedValue({ data: { success: true } });
    renderWishlist();

    await screen.findByText('Phone Case');
    const removeButtons = screen.getAllByRole('button', { name: 'Remove from wishlist' });
    await user.click(removeButtons[0]);

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/wishlist/p1'));
    await waitFor(() => expect(screen.queryByText('Phone Case')).not.toBeInTheDocument());
    expect(screen.getByText('Sold Out Charger')).toBeInTheDocument();
  });

  it('moves an in-stock item to the cart and removes it from the wishlist', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: ITEMS } } });
    api.delete.mockResolvedValue({ data: { success: true } });
    renderWishlist();

    await screen.findByText('Phone Case');
    const moveButtons = screen.getAllByRole('button', { name: 'Move to cart' });
    // ITEMS[0] (Phone Case, in stock) renders first; ITEMS[1] is out of stock and disabled.
    await user.click(moveButtons[0]);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ productId: 'p1', title: 'Phone Case', price: 500, qty: 1 }),
    ]);
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/wishlist/p1'));
  });

  it('disables "move to cart" for an out-of-stock item', async () => {
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: [ITEMS[1]] } } });
    renderWishlist();

    await screen.findByText('Sold Out Charger');
    expect(screen.getByRole('button', { name: 'Move to cart' })).toBeDisabled();
  });

  it('renders translated content in Arabic', async () => {
    api.get.mockResolvedValue({ data: { success: true, wishlist: { items: [] } } });
    i18n.changeLanguage('ar');
    renderWishlist();

    expect(await screen.findByText('قائمة المفضلة فارغة')).toBeInTheDocument();
  });
});
