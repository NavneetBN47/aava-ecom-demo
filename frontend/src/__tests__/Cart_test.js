import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../components/Cart';
import { CartContext } from '../context/CartContext';

// Mock CartContext
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
        <Cart />
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Cart component successfully', () => {
    renderWithContext();
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('displays empty cart message when cart is empty', () => {
    renderWithContext();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('displays Continue Shopping button when cart is empty', () => {
    renderWithContext();
    const continueButton = screen.getByText(/continue shopping/i);
    expect(continueButton).toBeInTheDocument();
  });

  test('displays cart items when cart has products', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: 'test-image.jpg'
        }
      ],
      getCartTotal: jest.fn(() => 59.98)
    };

    renderWithContext(mockCartWithItems);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays quantity controls for cart items', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: 'test-image.jpg'
        }
      ]
    };

    renderWithContext(mockCartWithItems);
    const quantityElements = screen.getAllByText('2');
    expect(quantityElements.length).toBeGreaterThan(0);
  });

  test('displays remove button for cart items', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          image: 'test-image.jpg'
        }
      ]
    };

    renderWithContext(mockCartWithItems);
    const removeButtons = screen.getAllByRole('button');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  test('displays checkout functionality when cart has items', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          image: 'test-image.jpg'
        }
      ],
      getCartTotal: jest.fn(() => 29.99)
    };

    renderWithContext(mockCartWithItems);
    const checkoutButton = screen.getByText(/checkout/i);
    expect(checkoutButton).toBeInTheDocument();
  });

  test('calls removeFromCart when remove button is clicked', () => {
    const mockRemoveFromCart = jest.fn();
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          image: 'test-image.jpg'
        }
      ],
      removeFromCart: mockRemoveFromCart
    };

    renderWithContext(mockCartWithItems);
    const removeButton = screen.getByText(/remove/i);
    fireEvent.click(removeButton);
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
  });

  test('displays cart total correctly', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: 'test-image.jpg'
        }
      ],
      getCartTotal: jest.fn(() => 59.98)
    };

    renderWithContext(mockCartWithItems);
    expect(screen.getByText(/59.98/)).toBeInTheDocument();
  });

  test('snapshot test for empty cart', () => {
    const { container } = renderWithContext();
    expect(container).toMatchSnapshot();
  });

  test('snapshot test for cart with items', () => {
    const mockCartWithItems = {
      ...mockCartContextValue,
      cartItems: [
        {
          id: 1,
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          image: 'test-image.jpg'
        }
      ],
      getCartTotal: jest.fn(() => 29.99)
    };

    const { container } = renderWithContext(mockCartWithItems);
    expect(container).toMatchSnapshot();
  });
});
