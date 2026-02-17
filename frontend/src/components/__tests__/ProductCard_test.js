import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';

describe('ProductCard Component', () => {
  const mockOnAddToCart = jest.fn();

  const mockProductInStock = {
    id: 1,
    name: 'Test Product',
    description: 'This is a test product description',
    price: 99.99,
    stock: 10,
    imageUrl: 'test-product.jpg'
  };

  const mockProductOutOfStock = {
    id: 2,
    name: 'Out of Stock Product',
    description: 'This product is out of stock',
    price: 49.99,
    stock: 0,
    imageUrl: 'out-of-stock.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ProductCard component', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays product name', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays product description', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
  });

  test('displays product price', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText(/99.99/i)).toBeInTheDocument();
  });

  test('displays "Add to Cart" button when product is in stock', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
  });

  test('displays "Out of Stock" button when product is out of stock', () => {
    render(
      <ProductCard 
        product={mockProductOutOfStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  test('displays stock status for in-stock product', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });

  test('calls onAddToCart when "Add to Cart" button is clicked', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    const addToCartButton = screen.getByText(/add to cart/i);
    fireEvent.click(addToCartButton);
    expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProductInStock);
  });

  test('"Out of Stock" button is disabled', () => {
    render(
      <ProductCard 
        product={mockProductOutOfStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    const outOfStockButton = screen.getByText(/out of stock/i);
    expect(outOfStockButton).toBeDisabled();
  });

  test('renders product image with correct src', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    const productImage = screen.getByAltText('Test Product');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', 'test-product.jpg');
  });

  test('validates DOM structure', () => {
    const { container } = render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(container.querySelector('.product-card')).toBeTruthy();
  });

  test('renders all product props correctly', () => {
    render(
      <ProductCard 
        product={mockProductInStock} 
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText(/99.99/i)).toBeInTheDocument();
  });
});