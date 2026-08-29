import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import Browse from './Browse';
import '../i18n/i18n';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn() },
  resolveAssetUrl: (p) => p,
}));
import api from '../lib/api';

const product = (n) => ({
  _id: `id-${n}`,
  slug: `product-${n}`,
  title: `Ethiopian Coffee ${n}`,
  basePrice: 100 + n,
  images: [],
  rating: 4,
  reviewCount: 3,
  vendorId: { storeName: 'Test Roasters' },
});

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation((url) => {
    if (url === '/products') return Promise.resolve({ data: { data: [] } });
    if (url === '/search') return Promise.resolve({ data: { success: true, data: [] } });
    return Promise.resolve({ data: {} });
  });
});

describe('Browse — search', () => {
  it('calls GET /api/search with the q param and renders matching products', async () => {
    api.get.mockImplementation((url, config) => {
      if (url === '/search') {
        expect(config.params.q).toBe('coffee');
        return Promise.resolve({ data: { success: true, data: [product(1), product(2)] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderWithProviders(<Browse />, { route: '/browse?q=coffee' });

    expect(await screen.findByText('Ethiopian Coffee 1')).toBeInTheDocument();
    expect(screen.getByText('Ethiopian Coffee 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Results for/i })).toBeInTheDocument();
  });

  it('shows an empty state when the search returns nothing', async () => {
    renderWithProviders(<Browse />, { route: '/browse?q=nothingmatches' });
    expect(await screen.findByText(/No products match/i)).toBeInTheDocument();
  });

  it('paginates search results on the client (12 per page)', async () => {
    const many = Array.from({ length: 15 }, (_, i) => product(i + 1));
    api.get.mockImplementation((url) => {
      if (url === '/search') return Promise.resolve({ data: { success: true, data: many } });
      return Promise.resolve({ data: { data: [] } });
    });

    renderWithProviders(<Browse />, { route: '/browse?q=coffee' });

    expect(await screen.findByText('Ethiopian Coffee 1')).toBeInTheDocument();
    expect(screen.getByText('Ethiopian Coffee 12')).toBeInTheDocument();
    expect(screen.queryByText('Ethiopian Coffee 13')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByText('Ethiopian Coffee 13')).toBeInTheDocument();
  });

  it('falls back to GET /api/products when there is no search term', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/products') return Promise.resolve({ data: { data: [product(9)], total: 1 } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<Browse />, { route: '/browse' });

    expect(await screen.findByText('Ethiopian Coffee 9')).toBeInTheDocument();
    const searchCalls = api.get.mock.calls.filter(([url]) => url === '/search');
    expect(searchCalls).toHaveLength(0);
  });
});
