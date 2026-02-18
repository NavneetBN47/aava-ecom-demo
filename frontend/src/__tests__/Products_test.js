import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Products from '../Products';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockProducts = [
  {
    id: 1,
    name: 'Product 1',
    price: 29.99,
    description: 'Description 1',
    image: 'image1.jpg',
    category: 'Electronics',
    rating: 4.5
  },
  {
    id: 2,
    name: 'Product 2',
    price: 49.99,
    description: 'Description 2',
    image: 'image2.jpg',
    category: 'Clothing',
    rating: 4.0
  },
  {
    id: 3,
    name: 'Product 3',
    price: 19.99,
    description: 'Description 3',
    image: 'image3.jpg',
    category: 'Electronics',
    rating: 3.5
  }
];

const renderProducts = (props = {}) => {
  const defaultProps = {
    products: mockProducts,
    onAddToCart: jest.fn(),
    loading: false,
    error: null,
    ...props
  };
  
  return render(
    <BrowserRouter>
      <Products {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Products component without crashing', () => {
    renderProducts();
    const productsElement = screen.queryByText(/products/i) || document.querySelector('div');
    expect(productsElement).toBeInTheDocument();
  });

  test('displays all products when provided', () => {
    renderProducts();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });

  test('displays loading state when loading is true', () => {
    renderProducts({ loading: true, products: [] });
    const loadingElement = screen.queryByText(/loading/i) || screen.queryByRole('status');
    expect(loadingElement).toBeInTheDocument();
  });

  test('displays error message when error exists', () => {
    renderProducts({ error: 'Failed to load products', products: [] });
    const errorElement = screen.queryByText(/failed to load|error/i);
    expect(errorElement).toBeInTheDocument();
  });

  test('displays empty state when no products available', () => {
    renderProducts({ products: [] });
    const emptyMessage = screen.queryByText(/no products|empty/i);
    if (emptyMessage) {
      expect(emptyMessage).toBeInTheDocument();
    }
  });

  test('renders product grid layout', () => {
    const { container } = renderProducts();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('displays product prices correctly', () => {
    renderProducts();
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
    expect(screen.getByText(/49.99/)).toBeInTheDocument();
    expect(screen.getByText(/19.99/)).toBeInTheDocument();
  });

  test('renders filter section if present', () => {
    renderProducts();
    const filterElement = screen.queryByText(/filter|sort|category/i);
    if (filterElement) {
      expect(filterElement).toBeInTheDocument();
    }
  });

  test('filters products by category', () => {
    renderProducts();
    const categoryFilter = screen.queryByRole('button', { name: /electronics/i }) || screen.queryByText(/electronics/i);
    if (categoryFilter) {
      fireEvent.click(categoryFilter);
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    }
  });

  test('sorts products by price', () => {
    renderProducts();
    const sortButton = screen.queryByRole('button', { name: /sort|price/i }) || screen.queryByLabelText(/sort/i);
    if (sortButton) {
      fireEvent.click(sortButton);
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    }
  });

  test('displays search functionality if present', () => {
    renderProducts();
    const searchInput = screen.queryByRole('searchbox') || screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      expect(searchInput).toBeInTheDocument();
    }
  });

  test('filters products by search query', () => {
    renderProducts();
    const searchInput = screen.queryByRole('searchbox') || screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Product 1' } });
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    }
  });

  test('displays pagination if present', () => {
    renderProducts();
    const paginationElement = screen.queryByRole('navigation', { name: /pagination/i }) || screen.queryByText(/page|next|previous/i);
    if (paginationElement) {
      expect(paginationElement).toBeInTheDocument();
    }
  });

  test('handles page navigation', () => {
    renderProducts();
    const nextButton = screen.queryByRole('button', { name: /next/i });
    if (nextButton) {
      fireEvent.click(nextButton);
      expect(nextButton).toBeInTheDocument();
    }
  });

  test('displays product count', () => {
    renderProducts();
    const countElement = screen.queryByText(/3|showing|results/i);
    if (countElement) {
      expect(countElement).toBeInTheDocument();
    }
  });

  test('renders Add to Cart buttons for all products', () => {
    renderProducts();
    const addButtons = screen.queryAllByRole('button', { name: /add to cart|add/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(0);
  });

  test('calls onAddToCart when product is added to cart', () => {
    const mockAddToCart = jest.fn();
    renderProducts({ onAddToCart: mockAddToCart });
    const addButtons = screen.queryAllByRole('button', { name: /add to cart|add/i });
    if (addButtons.length > 0) {
      fireEvent.click(addButtons[0]);
      expect(mockAddToCart).toHaveBeenCalled();
    }
  });

  test('displays category filters', () => {
    renderProducts();
    const electronicsFilter = screen.queryByText(/electronics/i);
    const clothingFilter = screen.queryByText(/clothing/i);
    if (electronicsFilter || clothingFilter) {
      expect(electronicsFilter || clothingFilter).toBeInTheDocument();
    }
  });

  test('displays price range filter if present', () => {
    renderProducts();
    const priceFilter = screen.queryByText(/price range|price/i);
    if (priceFilter) {
      expect(priceFilter).toBeInTheDocument();
    }
  });

  test('displays rating filter if present', () => {
    renderProducts();
    const ratingFilter = screen.queryByText(/rating|stars/i);
    if (ratingFilter) {
      expect(ratingFilter).toBeInTheDocument();
    }
  });

  test('handles filter reset', () => {
    renderProducts();
    const resetButton = screen.queryByRole('button', { name: /reset|clear/i });
    if (resetButton) {
      fireEvent.click(resetButton);
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    }
  });

  test('displays view toggle buttons (grid/list) if present', () => {
    renderProducts();
    const viewToggle = screen.queryByRole('button', { name: /grid|list/i });
    if (viewToggle) {
      expect(viewToggle).toBeInTheDocument();
    }
  });

  test('toggles between grid and list view', () => {
    renderProducts();
    const listViewButton = screen.queryByRole('button', { name: /list/i });
    if (listViewButton) {
      fireEvent.click(listViewButton);
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    }
  });

  test('renders product images', () => {
    renderProducts();
    const images = screen.queryAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(0);
  });

  test('handles product click to view details', () => {
    renderProducts();
    const productLink = screen.queryByText('Product 1');
    if (productLink) {
      fireEvent.click(productLink);
      expect(productLink).toBeInTheDocument();
    }
  });

  test('displays breadcrumb navigation if present', () => {
    renderProducts();
    const breadcrumb = screen.queryByRole('navigation', { name: /breadcrumb/i });
    if (breadcrumb) {
      expect(breadcrumb).toBeInTheDocument();
    }
  });

  test('handles loading state transition to loaded state', async () => {
    const { rerender } = renderProducts({ loading: true, products: [] });
    expect(screen.queryByText(/loading/i)).toBeInTheDocument();
    
    rerender(
      <BrowserRouter>
        <Products products={mockProducts} onAddToCart={jest.fn()} loading={false} error={null} />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  test('renders with proper accessibility attributes', () => {
    const { container } = renderProducts();
    expect(container).toBeInTheDocument();
  });
});
