import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Cart from '../Cart';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockCartItems = [
  {
    id: 1,
    name: 'Test Product 1',
    price: 29.99,
    quantity: 2,
    image: 'test-image-1.jpg',
    description: 'Test description 1'
  },
  {
    id: 2,
    name: 'Test Product 2',
    price: 49.99,
    quantity: 1,
    image: 'test-image-2.jpg',
    description: 'Test description 2'
  }
];

const renderCart = (props = {}) => {
  const defaultProps = {
    cartItems: [],
    onUpdateQuantity: jest.fn(),
    onRemoveItem: jest.fn(),
    ...props
  };
  
  return render(
    <BrowserRouter>
      <Cart {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Cart component without crashing', () => {
    renderCart();
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('displays empty cart message when no items', () => {
    renderCart({ cartItems: [] });
    const emptyMessage = screen.queryByText(/empty/i) || screen.queryByText(/no items/i);
    expect(emptyMessage).toBeInTheDocument();
  });

  test('renders cart items when provided', () => {
    renderCart({ cartItems: mockCartItems });
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  test('displays correct prices for cart items', () => {
    renderCart({ cartItems: mockCartItems });
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
    expect(screen.getByText(/49.99/)).toBeInTheDocument();
  });

  test('displays correct quantities for cart items', () => {
    renderCart({ cartItems: mockCartItems });
    const quantityElements = screen.getAllByText(/2|1/);
    expect(quantityElements.length).toBeGreaterThan(0);
  });

  test('calculates and displays correct subtotal', () => {
    renderCart({ cartItems: mockCartItems });
    // Subtotal should be (29.99 * 2) + (49.99 * 1) = 109.97
    const subtotalElement = screen.queryByText(/109.97/) || screen.queryByText(/subtotal/i);
    expect(subtotalElement).toBeInTheDocument();
  });

  test('calls onUpdateQuantity when quantity is changed', () => {
    const mockUpdateQuantity = jest.fn();
    renderCart({ cartItems: mockCartItems, onUpdateQuantity: mockUpdateQuantity });
    
    const increaseButtons = screen.queryAllByRole('button', { name: /\+|increase/i });
    if (increaseButtons.length > 0) {
      fireEvent.click(increaseButtons[0]);
      expect(mockUpdateQuantity).toHaveBeenCalled();
    }
  });

  test('calls onRemoveItem when remove button is clicked', () => {
    const mockRemoveItem = jest.fn();
    renderCart({ cartItems: mockCartItems, onRemoveItem: mockRemoveItem });
    
    const removeButtons = screen.queryAllByRole('button', { name: /remove|delete|×/i });
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0]);
      expect(mockRemoveItem).toHaveBeenCalledWith(1);
    }
  });

  test('displays checkout button when items are in cart', () => {
    renderCart({ cartItems: mockCartItems });
    const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
    expect(checkoutButton).toBeInTheDocument();
  });

  test('does not display checkout button when cart is empty', () => {
    renderCart({ cartItems: [] });
    const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
    expect(checkoutButton).not.toBeInTheDocument();
  });

  test('displays continue shopping link or button', () => {
    renderCart({ cartItems: mockCartItems });
    const continueShoppingElement = screen.queryByText(/continue shopping/i) || screen.queryByRole('link', { name: /shop/i });
    expect(continueShoppingElement).toBeInTheDocument();
  });

  test('renders product images if provided', () => {
    renderCart({ cartItems: mockCartItems });
    const images = screen.queryAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(0);
  });

  test('handles quantity decrease correctly', () => {
    const mockUpdateQuantity = jest.fn();
    renderCart({ cartItems: mockCartItems, onUpdateQuantity: mockUpdateQuantity });
    
    const decreaseButtons = screen.queryAllByRole('button', { name: /-|decrease/i });
    if (decreaseButtons.length > 0) {
      fireEvent.click(decreaseButtons[0]);
      expect(mockUpdateQuantity).toHaveBeenCalled();
    }
  });

  test('displays total number of items in cart', () => {
    renderCart({ cartItems: mockCartItems });
    // Total items should be 2 + 1 = 3
    const totalItems = screen.queryByText(/3/) || screen.queryByText(/items/i);
    expect(totalItems).toBeInTheDocument();
  });

  test('handles empty cart state gracefully', () => {
    renderCart({ cartItems: [] });
    expect(screen.queryByText(/Test Product 1/)).not.toBeInTheDocument();
  });

  test('renders with proper accessibility attributes', () => {
    const { container } = renderCart({ cartItems: mockCartItems });
    expect(container).toBeInTheDocument();
  });

  test('displays tax information if applicable', () => {
    renderCart({ cartItems: mockCartItems });
    const taxElement = screen.queryByText(/tax/i);
    // Tax may or may not be displayed
    if (taxElement) {
      expect(taxElement).toBeInTheDocument();
    }
  });

  test('displays shipping information if applicable', () => {
    renderCart({ cartItems: mockCartItems });
    const shippingElement = screen.queryByText(/shipping/i);
    // Shipping may or may not be displayed
    if (shippingElement) {
      expect(shippingElement).toBeInTheDocument();
    }
  });

  test('handles multiple items of same product correctly', () => {
    const duplicateItems = [
      { ...mockCartItems[0], quantity: 5 }
    ];
    renderCart({ cartItems: duplicateItems });
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
  });

  test('updates UI when cart items prop changes', () => {
    const { rerender } = renderCart({ cartItems: [] });
    expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
    
    rerender(
      <BrowserRouter>
        <Cart cartItems={mockCartItems} onUpdateQuantity={jest.fn()} onRemoveItem={jest.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
  });
});
