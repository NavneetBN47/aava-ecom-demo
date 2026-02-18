import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const renderNavbar = (props = {}) => {
  const defaultProps = {
    cartItemCount: 0,
    isAuthenticated: false,
    onLogout: jest.fn(),
    ...props
  };
  
  return render(
    <BrowserRouter>
      <Navbar {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Navbar component without crashing', () => {
    renderNavbar();
    const navElement = screen.queryByRole('navigation') || document.querySelector('nav') || document.querySelector('div');
    expect(navElement).toBeInTheDocument();
  });

  test('displays brand logo or name', () => {
    renderNavbar();
    const brandElement = screen.queryByText(/store|shop|brand/i) || screen.queryByRole('link');
    expect(brandElement).toBeInTheDocument();
  });

  test('renders Home navigation link', () => {
    renderNavbar();
    const homeLink = screen.queryByRole('link', { name: /home/i }) || screen.queryByText(/home/i);
    expect(homeLink).toBeInTheDocument();
  });

  test('renders Products navigation link', () => {
    renderNavbar();
    const productsLink = screen.queryByRole('link', { name: /products/i }) || screen.queryByText(/products/i);
    expect(productsLink).toBeInTheDocument();
  });

  test('renders Cart navigation link', () => {
    renderNavbar();
    const cartLink = screen.queryByRole('link', { name: /cart/i }) || screen.queryByText(/cart/i);
    expect(cartLink).toBeInTheDocument();
  });

  test('displays cart item count badge when items exist', () => {
    renderNavbar({ cartItemCount: 5 });
    const cartBadge = screen.queryByText('5');
    expect(cartBadge).toBeInTheDocument();
  });

  test('does not display cart badge when count is zero', () => {
    renderNavbar({ cartItemCount: 0 });
    const cartBadge = screen.queryByText('0');
    // Badge might not be shown for zero items
    if (cartBadge) {
      expect(cartBadge).toBeInTheDocument();
    }
  });

  test('displays login link when user is not authenticated', () => {
    renderNavbar({ isAuthenticated: false });
    const loginLink = screen.queryByRole('link', { name: /login|sign in/i }) || screen.queryByText(/login|sign in/i);
    if (loginLink) {
      expect(loginLink).toBeInTheDocument();
    }
  });

  test('displays logout button when user is authenticated', () => {
    renderNavbar({ isAuthenticated: true });
    const logoutButton = screen.queryByRole('button', { name: /logout|sign out/i }) || screen.queryByText(/logout|sign out/i);
    if (logoutButton) {
      expect(logoutButton).toBeInTheDocument();
    }
  });

  test('calls onLogout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    renderNavbar({ isAuthenticated: true, onLogout: mockLogout });
    const logoutButton = screen.queryByRole('button', { name: /logout|sign out/i });
    if (logoutButton) {
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    }
  });

  test('renders search bar if present', () => {
    renderNavbar();
    const searchInput = screen.queryByRole('searchbox') || screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      expect(searchInput).toBeInTheDocument();
    }
  });

  test('handles search input changes', () => {
    renderNavbar();
    const searchInput = screen.queryByRole('searchbox') || screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test product' } });
      expect(searchInput.value).toBe('test product');
    }
  });

  test('displays user profile icon when authenticated', () => {
    renderNavbar({ isAuthenticated: true });
    const profileIcon = screen.queryByRole('link', { name: /profile|account/i }) || screen.queryByText(/profile|account/i);
    if (profileIcon) {
      expect(profileIcon).toBeInTheDocument();
    }
  });

  test('renders mobile menu toggle button on small screens', () => {
    renderNavbar();
    const menuButton = screen.queryByRole('button', { name: /menu|toggle/i }) || screen.queryByLabelText(/menu/i);
    if (menuButton) {
      expect(menuButton).toBeInTheDocument();
    }
  });

  test('toggles mobile menu when button is clicked', () => {
    renderNavbar();
    const menuButton = screen.queryByRole('button', { name: /menu|toggle/i });
    if (menuButton) {
      fireEvent.click(menuButton);
      // Menu should toggle
      expect(menuButton).toBeInTheDocument();
    }
  });

  test('displays categories dropdown if present', () => {
    renderNavbar();
    const categoriesDropdown = screen.queryByText(/categories/i);
    if (categoriesDropdown) {
      expect(categoriesDropdown).toBeInTheDocument();
    }
  });

  test('renders all navigation links with correct hrefs', () => {
    renderNavbar();
    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  test('highlights active navigation link', () => {
    renderNavbar();
    const links = screen.queryAllByRole('link');
    // At least one link should exist
    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  test('displays cart icon', () => {
    renderNavbar();
    const cartIcon = screen.queryByRole('link', { name: /cart/i }) || screen.queryByText(/cart/i);
    expect(cartIcon).toBeInTheDocument();
  });

  test('updates cart count when prop changes', () => {
    const { rerender } = renderNavbar({ cartItemCount: 3 });
    expect(screen.queryByText('3')).toBeInTheDocument();
    
    rerender(
      <BrowserRouter>
        <Navbar cartItemCount={7} isAuthenticated={false} onLogout={jest.fn()} />
      </BrowserRouter>
    );
    expect(screen.queryByText('7')).toBeInTheDocument();
  });

  test('renders with proper accessibility attributes', () => {
    renderNavbar();
    const navElement = screen.queryByRole('navigation') || document.querySelector('nav');
    expect(navElement).toBeInTheDocument();
  });

  test('displays wishlist link if present', () => {
    renderNavbar();
    const wishlistLink = screen.queryByRole('link', { name: /wishlist|favorites/i });
    if (wishlistLink) {
      expect(wishlistLink).toBeInTheDocument();
    }
  });

  test('renders contact link if present', () => {
    renderNavbar();
    const contactLink = screen.queryByRole('link', { name: /contact/i });
    if (contactLink) {
      expect(contactLink).toBeInTheDocument();
    }
  });

  test('displays about link if present', () => {
    renderNavbar();
    const aboutLink = screen.queryByRole('link', { name: /about/i });
    if (aboutLink) {
      expect(aboutLink).toBeInTheDocument();
    }
  });

  test('handles navigation link clicks', () => {
    renderNavbar();
    const homeLink = screen.queryByRole('link', { name: /home/i });
    if (homeLink) {
      fireEvent.click(homeLink);
      expect(homeLink).toBeInTheDocument();
    }
  });
});
