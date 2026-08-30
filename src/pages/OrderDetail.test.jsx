import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import i18n from '../i18n/i18n';
import OrderDetail from './OrderDetail';
import { useCartStore } from '../store/cartStore';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const order = {
  _id: 'order-1',
  orderNumber: 'ORD-000001',
  total: 200,
  shippingAddress: { name: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa', address: 'Bole' },
  subOrders: [
    {
      _id: 'sub-1',
      vendorId: 'v1',
      vendorName: 'Vendor A',
      status: 'confirmed',
      subtotal: 100,
      items: [{ productId: 'p1', title: 'Coffee beans', qty: 1, priceSnapshot: 100 }],
    },
    {
      _id: 'sub-2',
      vendorId: 'v2',
      vendorName: 'Vendor B',
      status: 'cancelled',
      cancelReason: 'Out of stock',
      subtotal: 100,
      items: [{ productId: 'p2', title: 'Scarf', qty: 2, priceSnapshot: 50 }],
    },
  ],
};

function LocationProbe() {
  const location = useLocation();
  return <p>at:{location.pathname}</p>;
}

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/orders/order-1']}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetail />} />
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

describe('OrderDetail', () => {
  it('fetches the order and renders one card per vendor sub-order with a status timeline', async () => {
    api.get.mockResolvedValue({ data: { success: true, order } });
    renderDetail();

    expect(api.get).toHaveBeenCalledWith('/orders/order-1');
    expect(await screen.findByText('ORD-000001')).toBeInTheDocument();
    expect(screen.getByText('From Vendor A')).toBeInTheDocument();
    expect(screen.getByText('From Vendor B')).toBeInTheDocument();
    // confirmed sub-order gets the placed->confirmed->shipped->delivered timeline
    expect(screen.getByText('Placed')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    // cancelled sub-order shows its reason instead of a timeline
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('shows a not-found message when the order fails to load', async () => {
    api.get.mockRejectedValue(new Error('404'));
    renderDetail();

    expect(await screen.findByText("We couldn't find that order.")).toBeInTheDocument();
  });

  it('re-order (whole order) adds every sub-order item to the cart and navigates to /cart', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, order } });
    renderDetail();

    await screen.findByText('ORD-000001');
    await user.click(screen.getByRole('button', { name: 'Re-order' }));

    await waitFor(() => expect(screen.getByText('at:/cart')).toBeInTheDocument());
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.productId === 'p1')).toEqual(
      expect.objectContaining({ title: 'Coffee beans', price: 100, qty: 1, vendor: 'Vendor A' })
    );
    expect(items.find((i) => i.productId === 'p2')).toEqual(
      expect.objectContaining({ title: 'Scarf', price: 50, qty: 2, vendor: 'Vendor B' })
    );
  });

  it('re-order for a single vendor only adds that sub-order\'s items', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { success: true, order } });
    renderDetail();

    await screen.findByText('ORD-000001');
    await user.click(screen.getAllByRole('button', { name: 'Re-order these items' })[0]);

    await waitFor(() => expect(screen.getByText('at:/cart')).toBeInTheDocument());
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ productId: 'p1', vendor: 'Vendor A' }));
  });
});
