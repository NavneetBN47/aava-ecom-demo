import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CartContext } from '../context/CartContext';

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
    <BrowserRouter>
      <CartContext.Provider value={contextValue}>
        <Navbar />
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  test('renders Navbar component successfully', () => {
    renderWithContext();
    expect(screen.getByText(/aava e-commerce/i)).toBeInTheDocument();
  });

  test('displays Aava E-Commerce logo', () => {
    renderWithContext();
    const logo = screen.getByText(/aava e-commerce/i);
    expect(logo).toBeInTheDocument();
  });

  test('displays Home navigation link', () => {
    renderWithContext();
    const homeLink = screen.getByText(/home/i);
    expect(homeLink).toBeInTheDocument();
  });

  test('displays Products navigation link', () => {
    renderWithContext();
    const productsLink = screen.getByText(/products/i);
    expect(productsLink).toBeInTheDocument();
  });

  test('displays Cart navigation link', () => {
    renderWithContext();
    const cartLink = screen.getByText(/cart/i);
    expect(cartLink).toBeInTheDocument();
  });

  test('does not display cart badge when cart is empty', () => {
    renderWithContext();
    const badge = screen.queryByText('0');
    // Badge should either not exist or not be visible when cart is empty
    expect(badge).not.toBeInTheDocument();
  });

  test('displays cart badge with item count when cart has items', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        { id: 1, name: 'Product 1', quantity: 2 },
        { id: 2, name: 'Product 2', quantity: 1 }
      ]
    };

    renderWithContext(mockCartWithItems);
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });

  test('displays correct cart item count in badge', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        { id: 1, name: 'Product 1', quantity: 5 }
      ]
    };

    renderWithContext(mockCartWithItems);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  test('all navigation links are clickable', () => {
    renderWithContext();
    const homeLink = screen.getByText(/home/i);
    const productsLink = screen.getByText(/products/i);
    const cartLink = screen.getByText(/cart/i);

    expect(homeLink.closest('a')).toHaveAttribute('href');
    expect(productsLink.closest('a')).toHaveAttribute('href');
    expect(cartLink.closest('a')).toHaveAttribute('href');
  });

  test('validates navbar structure with all required elements', () => {
    renderWithContext();
    expect(screen.getByText(/aava e-commerce/i)).toBeInTheDocument();
    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/products/i)).toBeInTheDocument();
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('cart badge updates when cart items change', () => {
    const { rerender } = renderWithContext();
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        { id: 1, name: 'Product 1', quantity: 3 }
      ]
    };

    rerender(
      <BrowserRouter>
        <CartContext.Provider value={mockCartWithItems}>
          <Navbar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('snapshot test for Navbar with empty cart', () => {
    const { container } = renderWithContext();
    expect(container).toMatchSnapshot();
  });

  test('snapshot test for Navbar with items in cart', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        { id: 1, name: 'Product 1', quantity: 2 }
      ]
    };

    const { container } = renderWithContext(mockCartWithItems);
    expect(container).toMatchSnapshot();
  });
});
