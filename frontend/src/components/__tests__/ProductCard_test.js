import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';
import { useCart } from '../../context/CartContext';

// Mock the useCart hook
jest.mock('../../context/CartContext');

describe('ProductCard Component', () => {
  const mockAddToCart = jest.fn();
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    category: 'electronics',
    price: 99.99,
    image: 'https://example.com/test-image.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue({
      addToCart: mockAddToCart,
    });
  });

  test('renders product title', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('renders product category', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  test('renders product price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/99.99/)).toBeInTheDocument();
  });

  test('renders product image with correct src', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
  });

  test('renders Add to Cart button', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  test('calls addToCart when Add to Cart button is clicked', () => {
    render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
  });

  test('renders all product properties correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('electronics')).toBeInTheDocument();
    expect(screen.getByText(/99.99/)).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  test('renders with different product data', () => {
    const differentProduct = {
      id: 2,
      title: 'Another Product',
      category: 'clothing',
      price: 49.99,
      image: 'https://example.com/another-image.jpg',
    };

    render(<ProductCard product={differentProduct} />);

    expect(screen.getByText('Another Product')).toBeInTheDocument();
    expect(screen.getByText('clothing')).toBeInTheDocument();
    expect(screen.getByText(/49.99/)).toBeInTheDocument();
  });

  test('validates DOM structure', () => {
    const { container } = render(<ProductCard product={mockProduct} />);

    expect(container.querySelector('img')).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { container } = render(<ProductCard product={mockProduct} />);

    expect(container).toMatchSnapshot();
  });
});
