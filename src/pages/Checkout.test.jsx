import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders';
import Checkout from './Checkout';
import { useCartStore } from '../store/cartStore';
import '../i18n/i18n';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const vendorAItem = { productId: 'p1', variantId: null, title: 'Coffee beans', price: 100, qty: 1, vendor: 'Vendor A' };
const vendorBItem = { productId: 'p2', variantId: null, title: 'Scarf', price: 50, qty: 2, vendor: 'Vendor B' };

async function fillAddress(user) {
  await user.type(screen.getByLabelText(/Full name/i), 'Abebe Kebede');
  await user.type(screen.getByPlaceholderText('911 234 567'), '911234567');
  await user.type(screen.getByLabelText(/City/i), 'Addis Ababa');
  await user.type(screen.getByLabelText(/Street address/i), 'Bole, near Edna Mall');
}

beforeEach(() => {
  useCartStore.getState().clear();
  api.get.mockReset();
  api.post.mockReset();
  api.delete.mockReset();
  // Checkout fetches saved addresses on mount; default to none so existing
  // manual-entry tests are unaffected unless a test overrides this.
  api.get.mockResolvedValue({ data: { addresses: [] } });
});

describe('Checkout', () => {
  it('shows an empty-cart state when there is nothing to check out', () => {
    renderWithProviders(<Checkout />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('groups cart items by vendor and totals them', () => {
    useCartStore.getState().add(vendorAItem);
    useCartStore.getState().add(vendorBItem);
    renderWithProviders(<Checkout />);

    expect(screen.getByText('Vendor A')).toBeInTheDocument();
    expect(screen.getByText('Vendor B')).toBeInTheDocument();
    // total = 100*1 + 50*2 = 200, shown at least in the summary sidebar
    expect(screen.getAllByText('200').length).toBeGreaterThan(0);
  });

  it('blocks submit and shows field errors when the address form is incomplete', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);
    renderWithProviders(<Checkout />);

    await user.click(screen.getByRole('button', { name: /Place order/i }));

    expect(await screen.findAllByText('This field is required')).not.toHaveLength(0);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('syncs the local cart to the backend, places the order, clears the cart, and navigates to confirmation', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);
    useCartStore.getState().add(vendorBItem);

    api.delete.mockResolvedValue({});
    api.post.mockImplementation((url) => {
      if (url === '/cart/items') return Promise.resolve({ data: {} });
      if (url === '/orders') {
        return Promise.resolve({
          data: { success: true, order: { _id: 'order-1', orderNumber: 'ORD-000001', total: 200, subOrders: [] } },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    function LocationProbe() {
      const location = useLocation();
      return <p>at:{location.pathname}</p>;
    }

    render_with_routes(<Checkout />, <LocationProbe />);

    await fillAddress(user);
    await user.click(screen.getByRole('button', { name: /Place order/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({ paymentMethod: 'cod' })));

    expect(api.delete).toHaveBeenCalledWith('/cart');
    expect(api.post).toHaveBeenCalledWith('/cart/items', { productId: 'p1', variantId: null, qty: 1 });
    expect(api.post).toHaveBeenCalledWith('/cart/items', { productId: 'p2', variantId: null, qty: 2 });

    await waitFor(() => expect(screen.getByText('at:/order-confirmation/order-1')).toBeInTheDocument());
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('shows an API error and keeps the cart when the order fails', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);

    api.delete.mockResolvedValue({});
    api.post.mockImplementation((url) => {
      if (url === '/cart/items') return Promise.resolve({ data: {} });
      if (url === '/orders') {
        const err = new Error('fail');
        err.response = { data: { error: { code: 'CART_EMPTY', message: 'Cart is empty' } } };
        return Promise.reject(err);
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    renderWithProviders(<Checkout />);
    await fillAddress(user);
    await user.click(screen.getByRole('button', { name: /Place order/i }));

    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('preselects the default saved address and places the order with savedAddressId', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);

    api.get.mockResolvedValue({
      data: {
        addresses: [
          { _id: 'addr-1', label: 'Home', recipient: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa', line: 'Bole', isDefault: false },
          { _id: 'addr-2', label: 'Office', recipient: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa', line: 'Kirkos', isDefault: true },
        ],
      },
    });
    api.delete.mockResolvedValue({});
    api.post.mockImplementation((url) => {
      if (url === '/cart/items') return Promise.resolve({ data: {} });
      if (url === '/orders') {
        return Promise.resolve({
          data: { success: true, order: { _id: 'order-2', orderNumber: 'ORD-000002', total: 100, subOrders: [] } },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    renderWithProviders(<Checkout />);

    // The default address (Office) should be preselected, and the manual form hidden.
    expect(await screen.findByText(/Kirkos/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full name/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Place order/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({ savedAddressId: 'addr-2' }))
    );
  });

  it('applies a valid coupon: shows the discount and lowers the total', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem); // 100
    useCartStore.getState().add(vendorBItem); // 100  -> total 200

    api.post.mockImplementation((url) => {
      if (url === '/coupons/validate') {
        return Promise.resolve({
          data: { valid: true, discount: 20, newTotal: 180, coupon: { code: 'SAVE20', type: 'fixed', value: 20 } },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    renderWithProviders(<Checkout />);

    await user.type(screen.getByLabelText(/Coupon code/i), 'save20');
    await user.click(screen.getByRole('button', { name: /^Apply$/i }));

    expect(await screen.findByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('SAVE20')).toBeInTheDocument();
    // Total row now reads 180 (200 − 20 discount)
    expect(screen.getByText('180')).toBeInTheDocument();
  });

  it('shows an error for an invalid coupon and leaves the total unchanged', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);

    api.post.mockImplementation((url) => {
      if (url === '/coupons/validate') {
        const err = new Error('bad');
        err.response = { data: { error: { code: 'COUPON_INVALID', message: 'nope' } } };
        return Promise.reject(err);
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    renderWithProviders(<Checkout />);

    await user.type(screen.getByLabelText(/Coupon code/i), 'BOGUS');
    await user.click(screen.getByRole('button', { name: /^Apply$/i }));

    expect(await screen.findByText(/Invalid or expired coupon/i)).toBeInTheDocument();
    expect(screen.queryByText('Discount')).not.toBeInTheDocument();
  });

  it('sends couponCode with the order once a coupon is applied', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);

    api.delete.mockResolvedValue({});
    api.post.mockImplementation((url) => {
      if (url === '/coupons/validate') {
        return Promise.resolve({
          data: { valid: true, discount: 10, newTotal: 90, coupon: { code: 'TEN', type: 'fixed', value: 10 } },
        });
      }
      if (url === '/cart/items') return Promise.resolve({ data: {} });
      if (url === '/orders') {
        return Promise.resolve({
          data: { success: true, order: { _id: 'order-9', orderNumber: 'ORD-9', total: 90, subOrders: [] } },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    renderWithProviders(<Checkout />);
    await user.type(screen.getByLabelText(/Coupon code/i), 'ten');
    await user.click(screen.getByRole('button', { name: /^Apply$/i }));
    await screen.findByText('TEN');

    await fillAddress(user);
    await user.click(screen.getByRole('button', { name: /Place order/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({ couponCode: 'TEN' }))
    );
  });

  it('switches to manual entry when "Enter a new address" is chosen', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(vendorAItem);

    api.get.mockResolvedValue({
      data: {
        addresses: [
          { _id: 'addr-1', label: 'Home', recipient: 'Abebe Kebede', phone: '+251911234567', city: 'Addis Ababa', line: 'Bole', isDefault: true },
        ],
      },
    });

    renderWithProviders(<Checkout />);

    await screen.findByText(/Bole/);
    await user.click(screen.getByRole('radio', { name: /Enter a new address/i }));

    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
  });
});

function render_with_routes(checkoutElement, confirmationElement) {
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={checkoutElement} />
        <Route path="/order-confirmation/:id" element={confirmationElement} />
      </Routes>
    </MemoryRouter>
  );
}
