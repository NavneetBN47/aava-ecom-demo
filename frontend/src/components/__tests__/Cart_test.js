import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../Cart';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

// Mock the hooks
jest.mock('../../context/CartContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Cart Component', () => {
  const mockNavigate = jest.fn();
  const mockUpdateQuantity = jest.fn();
  const mockRemoveFromCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders Shopping Cart heading', () => {
    useCart.mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 0,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  test('displays "Your cart is empty" message when cart is empty', () => {
    useCart.mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 0,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  test('renders Continue Shopping button', () => {
    useCart.mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 0,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  test('displays cart items with quantity controls when cart has items', () => {
    const mockCart = [
      {
        id: 1,
        title: 'Test Product',
        price: 29.99,
        quantity: 2,
        image: 'test.jpg',
      },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 59.98,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
  });

  test('displays cart total when cart has items', () => {
    const mockCart = [
      {
        id: 1,
        title: 'Test Product',
        price: 29.99,
        quantity: 2,
        image: 'test.jpg',
      },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 59.98,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText(/59.98/)).toBeInTheDocument();
  });

  test('renders Proceed to Checkout button when cart has items', () => {
    const mockCart = [
      {
        id: 1,
        title: 'Test Product',
        price: 29.99,
        quantity: 2,
        image: 'test.jpg',
      },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 59.98,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
  });

  test('calls navigate when Continue Shopping button is clicked', () => {
    useCart.mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 0,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const continueButton = screen.getByText('Continue Shopping');
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalled();
  });

  test('matches snapshot for empty cart', () => {
    useCart.mockReturnValue({
      cart: [],
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 0,
    });

    const { container } = render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });

  test('matches snapshot for cart with items', () => {
    const mockCart = [
      {
        id: 1,
        title: 'Test Product',
        price: 29.99,
        quantity: 2,
        image: 'test.jpg',
      },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
      getCartTotal: () => 59.98,
    });

    const { container } = render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });
});
