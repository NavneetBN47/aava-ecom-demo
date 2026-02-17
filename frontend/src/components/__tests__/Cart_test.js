import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from '../Cart';

describe('Cart Component', () => {
  const mockOnRemoveFromCart = jest.fn();
  const mockOnUpdateQuantity = jest.fn();

  const mockCartItems = [
    {
      id: 1,
      name: 'Test Product 1',
      price: 29.99,
      quantity: 2,
      imageUrl: 'test-image-1.jpg'
    },
    {
      id: 2,
      name: 'Test Product 2',
      price: 49.99,
      quantity: 1,
      imageUrl: 'test-image-2.jpg'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Cart component', () => {
    render(
      <Cart 
        cart={[]} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('displays "Your cart is empty" when cart is empty', () => {
    render(
      <Cart 
        cart={[]} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('displays "Shopping Cart" heading', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText(/shopping cart/i)).toBeInTheDocument();
  });

  test('displays "Order Summary" section', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText(/order summary/i)).toBeInTheDocument();
  });

  test('displays "Proceed to Checkout" button when cart has items', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText(/proceed to checkout/i)).toBeInTheDocument();
  });

  test('renders cart items with correct product names', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  test('displays Remove button for each cart item', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    const removeButtons = screen.getAllByText(/remove/i);
    expect(removeButtons).toHaveLength(mockCartItems.length);
  });

  test('calls onRemoveFromCart when Remove button is clicked', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    const removeButtons = screen.getAllByText(/remove/i);
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemoveFromCart).toHaveBeenCalledTimes(1);
  });

  test('displays quantity controls for cart items', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    const quantityElements = screen.getAllByText(/quantity/i);
    expect(quantityElements.length).toBeGreaterThan(0);
  });

  test('renders correct number of cart items', () => {
    render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  test('validates DOM structure with cart items', () => {
    const { container } = render(
      <Cart 
        cart={mockCartItems} 
        onRemoveFromCart={mockOnRemoveFromCart}
        onUpdateQuantity={mockOnUpdateQuantity}
      />
    );
    expect(container.querySelector('.cart')).toBeTruthy();
  });
});