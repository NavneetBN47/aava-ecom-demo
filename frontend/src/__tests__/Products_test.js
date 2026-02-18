import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../components/Products';
import { CartContext } from '../context/CartContext';

// Mock fetch
global.fetch = jest.fn();

const mockProducts = [
  {
    id: 1,
    name: 'Product 1',
    description: 'Description 1',
    price: 19.99,
    image: 'product1.jpg'
  },
  {
    id: 2,
    name: 'Product 2',
    description: 'Description 2',
    price: 29.99,
    image: 'product2.jpg'
  },
  {
    id: 3,
    name: 'Product 3',
    description: 'Description 3',
    price: 39.99,
    image: 'product3.jpg'
  }
];

const mockCartContextValue = {
  cartItems: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getCartTotal: jest.fn(() => 0)
};

const renderWithContext = (contextValue = mockCartContextValue) => {
  return render(
    <CartContext.Provider value={contextValue}>
      <Products />
    </CartContext.Provider>
  );
};

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders Products component successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  test('displays loading state with Loading products text', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    renderWithContext();
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  test('fetches and displays products from API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });
  });

  test('displays products in grid layout', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    const { container } = renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const productCards = container.querySelectorAll('[class*="product"]');
    expect(productCards.length).toBeGreaterThan(0);
  });

  test('uses ProductCard components to display products', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText(/19.99/i)).toBeInTheDocument();
    });
  });

  test('displays mock data fallback when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithContext();

    await waitFor(() => {
      const products = screen.queryAllByText(/product/i);
      expect(products.length).toBeGreaterThan(0);
    });
  });

  test('handles empty product list', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.queryByText(/loading products/i)).not.toBeInTheDocument();
    });
  });

  test('displays all product information correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText(/19.99/i)).toBeInTheDocument();
    });
  });

  test('loading state disappears after products are loaded', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading products/i)).not.toBeInTheDocument();
    });
  });

  test('calls fetch on component mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('renders multiple ProductCard components', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithContext();

    await waitFor(() => {
      const addToCartButtons = screen.getAllByText(/add to cart/i);
      expect(addToCartButtons.length).toBe(3);
    });
  });

  test('snapshot test for loading state', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    const { container } = renderWithContext();
    expect(container).toMatchSnapshot();
  });

  test('snapshot test for products loaded state', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    const { container } = renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
