import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../components/ProductCard';
import { CartContext } from '../context/CartContext';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'This is a test product description',
  price: 29.99,
  image: 'test-product.jpg'
};

const mockCartContextValue = {
  cartItems: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getCartTotal: jest.fn(() => 0)
};

const renderWithContext = (product = mockProduct, contextValue = mockCartContextValue) => {
  return render(
    <CartContext.Provider value={contextValue}>
      <ProductCard product={product} />
    </CartContext.Provider>
  );
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ProductCard component successfully', () => {
    renderWithContext();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays product name correctly', () => {
    renderWithContext();
    const productName = screen.getByText('Test Product');
    expect(productName).toBeInTheDocument();
  });

  test('displays product description correctly', () => {
    renderWithContext();
    const productDescription = screen.getByText('This is a test product description');
    expect(productDescription).toBeInTheDocument();
  });

  test('displays product price correctly', () => {
    renderWithContext();
    const productPrice = screen.getByText(/29.99/i);
    expect(productPrice).toBeInTheDocument();
  });

  test('displays product image with correct src', () => {
    renderWithContext();
    const productImage = screen.getByAltText('Test Product');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', 'test-product.jpg');
  });

  test('displays Add to Cart button', () => {
    renderWithContext();
    const addToCartButton = screen.getByText(/add to cart/i);
    expect(addToCartButton).toBeInTheDocument();
  });

  test('Add to Cart button is clickable', () => {
    renderWithContext();
    const addToCartButton = screen.getByText(/add to cart/i);
    expect(addToCartButton).toBeEnabled();
  });

  test('calls addToCart when Add to Cart button is clicked', () => {
    const mockAddToCart = jest.fn();
    const contextWithMock = {
      ...mockCartContextValue,
      addToCart: mockAddToCart
    };

    renderWithContext(mockProduct, contextWithMock);
    const addToCartButton = screen.getByText(/add to cart/i);
    fireEvent.click(addToCartButton);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  test('renders with different product props', () => {
    const differentProduct = {
      id: 2,
      name: 'Another Product',
      description: 'Different description',
      price: 49.99,
      image: 'another-product.jpg'
    };

    renderWithContext(differentProduct);
    expect(screen.getByText('Another Product')).toBeInTheDocument();
    expect(screen.getByText('Different description')).toBeInTheDocument();
    expect(screen.getByText(/49.99/i)).toBeInTheDocument();
  });

  test('validates all product properties are displayed', () => {
    renderWithContext();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText(/29.99/i)).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
  });

  test('product image has correct alt text', () => {
    renderWithContext();
    const productImage = screen.getByAltText('Test Product');
    expect(productImage).toHaveAttribute('alt', 'Test Product');
  });

  test('handles product with long description', () => {
    const productWithLongDesc = {
      ...mockProduct,
      description: 'This is a very long product description that contains a lot of text to test how the component handles lengthy descriptions'
    };

    renderWithContext(productWithLongDesc);
    expect(screen.getByText(/very long product description/i)).toBeInTheDocument();
  });

  test('snapshot test for ProductCard', () => {
    const { container } = renderWithContext();
    expect(container).toMatchSnapshot();
  });
});
