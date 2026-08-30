import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import i18n from '../i18n/i18n';
import Product from './Product';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const PRODUCT = {
  _id: 'p1',
  slug: 'phone-case',
  title: 'Phone Case',
  description: 'A sturdy case',
  basePrice: 500,
  price: 500,
  currency: 'ETB',
  stock: 10,
  images: [],
  rating: 4.5,
  reviewCount: 2,
  categoryId: { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
  vendorId: { _id: 'v1', storeName: 'Vendor One', slug: 'vendor-one' },
};

const EXISTING_REVIEWS = [
  {
    _id: 'r1',
    buyerId: { _id: 'buyer-other', name: 'Selam T.' },
    rating: 5,
    comment: 'Great case, fits perfectly.',
    verifiedPurchase: true,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

function mockApiGet({ orders = [], wishlistItems = [], reviews = EXISTING_REVIEWS } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/products/phone-case') {
      return Promise.resolve({
        data: { success: true, data: { product: PRODUCT, variants: [], vendorSummary: PRODUCT.vendorId, reviewSummary: {} } },
      });
    }
    if (url === '/products/p1/reviews') {
      return Promise.resolve({
        data: { success: true, data: reviews, pagination: { total: reviews.length, page: 1, pages: 1 } },
      });
    }
    if (url === '/products') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/orders') {
      return Promise.resolve({ data: { success: true, orders } });
    }
    if (url === '/wishlist') {
      return Promise.resolve({ data: { success: true, wishlist: { items: wishlistItems } } });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
}

function LocationProbe() {
  const location = useLocation();
  return <p>at:{location.pathname}</p>;
}

function renderProduct() {
  render(
    <MemoryRouter initialEntries={['/product/phone-case']}>
      <Routes>
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/login" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

const deliveredOrder = {
  subOrders: [{ status: 'delivered', items: [{ productId: 'p1', qty: 1 }] }],
};

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  useCartStore.getState().clear();
  useAuthStore.getState().logout();
  i18n.changeLanguage('en');
});

describe('Product', () => {
  it('shows the product, its average rating, and the review list with a verified badge', async () => {
    mockApiGet();
    renderProduct();

    expect(await screen.findByText('Phone Case')).toBeInTheDocument();
    expect(screen.getByText('ETB 500')).toBeInTheDocument();
    expect(await screen.findByText('Great case, fits perfectly.')).toBeInTheDocument();
    expect(screen.getByText('Selam T.')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('shows a login hint instead of the review form for a guest', async () => {
    mockApiGet();
    renderProduct();

    expect(await screen.findByText('Phone Case')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in to write a review' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/share your experience/i)).not.toBeInTheDocument();
  });

  it('shows a purchase hint instead of the review form for a buyer who has not purchased the item', async () => {
    useAuthStore.getState().setAuth({ user: { _id: 'buyer-1', role: 'buyer' }, token: 'tok' });
    mockApiGet({ orders: [] });
    renderProduct();

    expect(await screen.findByText('Phone Case')).toBeInTheDocument();
    expect(
      await screen.findByText('Purchase and receive this product to write a review.')
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/share your experience/i)).not.toBeInTheDocument();
  });

  it('lets a purchaser submit a review and see it appear in the list', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth({ user: { _id: 'buyer-1', role: 'buyer' }, token: 'tok' });
    mockApiGet({ orders: [deliveredOrder] });
    renderProduct();

    const textarea = await screen.findByPlaceholderText(/share your experience/i);
    await user.type(textarea, 'Works great for me too!');

    const newReview = {
      _id: 'r2',
      buyerId: { _id: 'buyer-1', name: 'Me' },
      rating: 5,
      comment: 'Works great for me too!',
      verifiedPurchase: true,
      createdAt: '2026-08-20T00:00:00.000Z',
    };
    api.post.mockResolvedValue({ data: { success: true, data: newReview } });
    // After a successful POST, Product.jsx resets to review page 1 and refetches both the
    // review list and the product (for the refreshed rating/count) — reflect that here.
    mockApiGet({ orders: [deliveredOrder], reviews: [newReview, ...EXISTING_REVIEWS] });

    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(api.post).toHaveBeenCalledWith('/products/p1/reviews', {
      rating: 5,
      comment: 'Works great for me too!',
    });
    expect(await screen.findByText('Works great for me too!')).toBeInTheDocument();
    expect(screen.getByText('Thanks — your review has been posted.')).toBeInTheDocument();
  });

  it('toggles the wishlist heart on the product page', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth({ user: { _id: 'buyer-1', role: 'buyer' }, token: 'tok' });
    mockApiGet({ orders: [] });
    api.post.mockResolvedValue({ data: { success: true } });
    renderProduct();

    await screen.findByText('Phone Case');
    const heartButton = screen.getByRole('button', { name: 'Add to wishlist' });
    expect(heartButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(heartButton);

    expect(api.post).toHaveBeenCalledWith('/wishlist', { productId: 'p1' });
    expect(await screen.findByRole('button', { name: 'Remove from wishlist' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('sends a guest to /login when tapping the wishlist heart', async () => {
    const user = userEvent.setup();
    mockApiGet();
    renderProduct();

    await screen.findByText('Phone Case');
    await user.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    await waitFor(() => expect(screen.getByText('at:/login')).toBeInTheDocument());
  });

  it('renders translated content in Arabic', async () => {
    mockApiGet();
    i18n.changeLanguage('ar');
    renderProduct();

    expect(await screen.findByText('سجّل الدخول لكتابة تقييم')).toBeInTheDocument();
  });
});
