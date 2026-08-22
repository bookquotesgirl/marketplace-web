import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderConfirmation from './OrderConfirmation';
import '../i18n/i18n';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const order = {
  _id: 'order-1',
  orderNumber: 'ORD-000001',
  total: 200,
  paymentMethod: 'cod',
  shippingAddress: { name: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa', address: 'Bole' },
  subOrders: [
    {
      _id: 'sub-1',
      vendorId: 'v1',
      vendorName: 'Vendor A',
      status: 'placed',
      subtotal: 100,
      items: [{ productId: 'p1', title: 'Coffee beans', qty: 1, priceSnapshot: 100 }],
    },
    {
      _id: 'sub-2',
      vendorId: 'v2',
      vendorName: 'Vendor B',
      status: 'placed',
      subtotal: 100,
      items: [{ productId: 'p2', title: 'Scarf', qty: 2, priceSnapshot: 50 }],
    },
  ],
};

function renderConfirmation({ state } = {}) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/order-confirmation/order-1', state }]}>
      <Routes>
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OrderConfirmation', () => {
  it('renders the order number, totals, and one card per vendor sub-order from router state', () => {
    renderConfirmation({ state: { order } });

    expect(screen.getByText('ORD-000001')).toBeInTheDocument();
    expect(screen.getByText('Vendor A', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Vendor B', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('falls back to GET /api/orders/:id when opened without router state', async () => {
    api.get.mockResolvedValue({ data: { success: true, order } });
    renderConfirmation();

    expect(await screen.findByText('ORD-000001')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/orders/order-1');
  });

  it('shows a not-found message when the order fails to load', async () => {
    api.get.mockRejectedValue(new Error('404'));
    renderConfirmation();

    expect(await screen.findByText("We couldn't find that order.")).toBeInTheDocument();
  });
});
