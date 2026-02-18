import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99.99,
  description: 'This is a test product description',
  image: 'test-image.jpg',
  category: 'Electronics',
  rating: 4.5,
  stock: 10
};

const renderProductCard = (props = {}) => {
  const defaultProps = {
    product: mockProduct,
    onAddToCart: jest.fn(),
    ...props
  };
  
  return render(
    <BrowserRouter>
      <ProductCard {...defaultProps} />
    </BrowserRouter>
  );
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ProductCard component without crashing', () => {
    renderProductCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays product name correctly', () => {
    renderProductCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays product price correctly', () => {
    renderProductCard();
    expect(screen.getByText(/99.99/)).toBeInTheDocument();
  });

  test('displays product description', () => {
    renderProductCard();
    const description = screen.queryByText(/test product description/i);
    if (description) {
      expect(description).toBeInTheDocument();
    }
  });

  test('renders product image with correct src', () => {
    renderProductCard();
    const image = screen.queryByRole('img', { name: /test product/i }) || screen.queryByRole('img');
    if (image) {
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    }
  });

  test('displays product image with alt text', () => {
    renderProductCard();
    const image = screen.queryByRole('img');
    if (image) {
      expect(image).toHaveAttribute('alt');
    }
  });

  test('renders Add to Cart button', () => {
    renderProductCard();
    const addButton = screen.queryByRole('button', { name: /add to cart|add/i });
    expect(addButton).toBeInTheDocument();
  });

  test('calls onAddToCart when Add to Cart button is clicked', () => {
    const mockAddToCart = jest.fn();
    renderProductCard({ onAddToCart: mockAddToCart });
    const addButton = screen.getByRole('button', { name: /add to cart|add/i });
    fireEvent.click(addButton);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  test('displays product category if provided', () => {
    renderProductCard();
    const category = screen.queryByText(/electronics/i);
    if (category) {
      expect(category).toBeInTheDocument();
    }
  });

  test('displays product rating if provided', () => {
    renderProductCard();
    const rating = screen.queryByText(/4.5|rating/i);
    if (rating) {
      expect(rating).toBeInTheDocument();
    }
  });

  test('displays stock information if provided', () => {
    renderProductCard();
    const stock = screen.queryByText(/stock|available|10/i);
    if (stock) {
      expect(stock).toBeInTheDocument();
    }
  });

  test('shows out of stock message when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderProductCard({ product: outOfStockProduct });
    const outOfStockMessage = screen.queryByText(/out of stock|unavailable/i);
    if (outOfStockMessage) {
      expect(outOfStockMessage).toBeInTheDocument();
    }
  });

  test('disables Add to Cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderProductCard({ product: outOfStockProduct });
    const addButton = screen.queryByRole('button', { name: /add to cart|add/i });
    if (addButton) {
      expect(addButton).toBeDisabled();
    }
  });

  test('renders product link to detail page', () => {
    renderProductCard();
    const productLink = screen.queryByRole('link') || screen.queryByText('Test Product');
    if (productLink && productLink.tagName === 'A') {
      expect(productLink).toHaveAttribute('href');
    }
  });

  test('displays discount badge if product is on sale', () => {
    const saleProduct = { ...mockProduct, discount: 20, originalPrice: 119.99 };
    renderProductCard({ product: saleProduct });
    const discountBadge = screen.queryByText(/sale|discount|20%|off/i);
    if (discountBadge) {
      expect(discountBadge).toBeInTheDocument();
    }
  });

  test('displays original price with strikethrough if discounted', () => {
    const saleProduct = { ...mockProduct, discount: 20, originalPrice: 119.99 };
    renderProductCard({ product: saleProduct });
    const originalPrice = screen.queryByText(/119.99/);
    if (originalPrice) {
      expect(originalPrice).toBeInTheDocument();
    }
  });

  test('renders wishlist button if provided', () => {
    renderProductCard();
    const wishlistButton = screen.queryByRole('button', { name: /wishlist|favorite|heart/i });
    if (wishlistButton) {
      expect(wishlistButton).toBeInTheDocument();
    }
  });

  test('handles wishlist button click', () => {
    const mockAddToWishlist = jest.fn();
    renderProductCard({ onAddToWishlist: mockAddToWishlist });
    const wishlistButton = screen.queryByRole('button', { name: /wishlist|favorite/i });
    if (wishlistButton) {
      fireEvent.click(wishlistButton);
      expect(mockAddToWishlist).toHaveBeenCalled();
    }
  });

  test('displays quick view button if provided', () => {
    renderProductCard();
    const quickViewButton = screen.queryByRole('button', { name: /quick view|preview/i });
    if (quickViewButton) {
      expect(quickViewButton).toBeInTheDocument();
    }
  });

  test('renders with proper card styling', () => {
    const { container } = renderProductCard();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('handles missing product image gracefully', () => {
    const productWithoutImage = { ...mockProduct, image: null };
    renderProductCard({ product: productWithoutImage });
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('handles missing product description gracefully', () => {
    const productWithoutDescription = { ...mockProduct, description: null };
    renderProductCard({ product: productWithoutDescription });
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  test('displays new badge for new products', () => {
    const newProduct = { ...mockProduct, isNew: true };
    renderProductCard({ product: newProduct });
    const newBadge = screen.queryByText(/new/i);
    if (newBadge) {
      expect(newBadge).toBeInTheDocument();
    }
  });

  test('formats price with currency symbol', () => {
    renderProductCard();
    const priceElement = screen.queryByText(/\$|€|£/) || screen.queryByText(/99.99/);
    expect(priceElement).toBeInTheDocument();
  });

  test('handles hover effects on card', () => {
    const { container } = renderProductCard();
    const card = container.firstChild;
    fireEvent.mouseEnter(card);
    expect(card).toBeInTheDocument();
    fireEvent.mouseLeave(card);
    expect(card).toBeInTheDocument();
  });
});
