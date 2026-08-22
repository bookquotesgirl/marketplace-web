import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import i18n from '../i18n/i18n';
import Orders from './Orders';
import { useCartStore } from '../store/cartStore';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const orders = [
  {
    _id: 'order-1',
    orderNumber: 'ORD-000001',
    total: 300,
    createdAt: '2026-08-01T10:00:00.000Z',
    subOrders: [
      {
        _id: 'sub-1',
        vendorId: 'v1',
        vendorName: 'Vendor A',
        status: 'shipped',
        subtotal: 300,
        items: [{ productId: 'p1', title: 'Coffee beans', qty: 1, priceSnapshot: 300 }],
      },
    ],
  },
  {
    _id: 'order-2',
    orderNumber: 'ORD-000002',
    total: 100,
    createdAt: '2026-07-20T10:00:00.000Z',
    subOrders: [
      { _id: 'sub-2', vendorId: 'v1', vendorName: 'Vendor A', status: 'placed', subtotal: 50, items: [{ productId: 'p2', qty: 1, priceSnapshot: 50 }] },
      { _id: 'sub-3', vendorId: 'v2', vendorName: 'Vendor B', status: 'delivered', subtotal: 50, items: [{ productId: 'p3', title: 'Scarf', qty: 1, priceSnapshot: 50 }] },
    ],
  },
];

function LocationProbe() {
  const location = useLocation();
  return <p>at:{location.pathname}</p>;
}

function renderOrders() {
  render(
    <MemoryRouter initialEntries={['/orders']}>
      <Routes>
        <Route path="/orders" element={<Orders />} />
        <Route path="/cart" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useCartStore.getState().clear();
  api.get.mockReset();
  i18n.changeLanguage('en');
});

describe('Orders', () => {
  it('shows a spinner while loading, then the order list with overall status per order', async () => {
    api.get.mockResolvedValue({ data: { success: true, orders } });
    renderOrders();

    expect(await screen.findByText('ORD-000001')).toBeInTheDocument();
    expect(screen.getByText('ORD-000002')).toBeInTheDocument();
    // order-1: single sub-order 'shipped' -> overall 'Shipped'
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    // order-2: 'placed' + 'delivered' -> least-progressed non-cancelled = 'placed' -> 'Placed'
    expect(screen.getByText('Placed')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/orders');
  });

  it('shows the empty state with a link to browse when there are no orders', async () => {
    api.get.mockResolvedValue({ data: { success: true, orders: [] } });
    renderOrders();

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/browse');
  });

  it('shows an error message when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));
    renderOrders();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('re-order repopulates the cart with the order items and navigates to /cart', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, orders } });
    renderOrders();

    await screen.findByText('ORD-000001');
    await user.click(screen.getAllByRole('button', { name: 'Re-order' })[0]);

    await waitFor(() => expect(screen.getByText('at:/cart')).toBeInTheDocument());
    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ productId: 'p1', title: 'Coffee beans', price: 300, qty: 1, vendor: 'Vendor A' }),
    ]);
  });

  it('falls back to a placeholder title when the order item has no title', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, orders } });
    renderOrders();

    await screen.findByText('ORD-000002');
    await user.click(screen.getAllByRole('button', { name: 'Re-order' })[1]);

    await waitFor(() => expect(useCartStore.getState().items.length).toBeGreaterThan(0));
    expect(useCartStore.getState().items.find((i) => i.productId === 'p2').title).toBe('Item');
  });

  it('renders translated content in Arabic', async () => {
    api.get.mockResolvedValue({ data: { success: true, orders } });
    i18n.changeLanguage('ar');
    renderOrders();

    expect(await screen.findByText('طلباتي')).toBeInTheDocument();
  });
});
