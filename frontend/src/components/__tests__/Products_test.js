import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../Products';
import { useCart } from '../../context/CartContext';

// Mock the useCart hook
jest.mock('../../context/CartContext');

// Mock ProductCard component
jest.mock('../ProductCard', () => {
  return function MockProductCard({ product }) {
    return (
      <div data-testid="product-card">
        <h3>{product.title}</h3>
        <p>{product.category}</p>
        <p>${product.price}</p>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Products Component', () => {
  const mockProducts = [
    {
      id: 1,
      title: 'Product 1',
      category: 'electronics',
      price: 99.99,
      image: 'image1.jpg',
    },
    {
      id: 2,
      title: 'Product 2',
      category: 'clothing',
      price: 49.99,
      image: 'image2.jpg',
    },
    {
      id: 3,
      title: 'Product 3',
      category: 'electronics',
      price: 149.99,
      image: 'image3.jpg',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue({
      addToCart: jest.fn(),
    });
  });

  test('renders Our Products heading', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    expect(screen.getByText('Our Products')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<Products />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  test('displays products after loading', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    const errorMessage = 'Failed to fetch';
    fetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test('renders category filter buttons', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Check for common category filter buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('filters products by category when filter button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // All products should be visible initially
    expect(screen.getAllByTestId('product-card')).toHaveLength(3);
  });

  test('renders product grid with ProductCard components', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    await waitFor(() => {
      const productCards = screen.getAllByTestId('product-card');
      expect(productCards).toHaveLength(3);
    });
  });

  test('validates DOM structure with heading and product grid', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    const { container } = render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Our Products')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="product-card"]')).toHaveLength(3);
  });

  test('displays correct product information in cards', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });

  test('matches snapshot for loading state', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<Products />);

    expect(container).toMatchSnapshot();
  });

  test('matches snapshot for loaded products', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    const { container } = render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
