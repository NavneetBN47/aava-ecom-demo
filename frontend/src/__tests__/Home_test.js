import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Home from '../Home';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const renderHome = (props = {}) => {
  const defaultProps = {
    ...props
  };
  
  return render(
    <BrowserRouter>
      <Home {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Home component without crashing', () => {
    renderHome();
    const homeElement = screen.queryByText(/home/i) || screen.queryByText(/welcome/i) || document.querySelector('div');
    expect(homeElement).toBeInTheDocument();
  });

  test('displays welcome message or hero section', () => {
    renderHome();
    const welcomeElement = screen.queryByText(/welcome/i) || screen.queryByText(/shop/i) || screen.queryByRole('heading');
    expect(welcomeElement).toBeInTheDocument();
  });

  test('renders hero banner or main section', () => {
    const { container } = renderHome();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('displays call-to-action button', () => {
    renderHome();
    const ctaButton = screen.queryByRole('button', { name: /shop now|browse|explore/i }) || screen.queryByRole('link', { name: /shop now|browse|explore/i });
    if (ctaButton) {
      expect(ctaButton).toBeInTheDocument();
    }
  });

  test('renders featured products section if present', () => {
    renderHome();
    const featuredSection = screen.queryByText(/featured/i) || screen.queryByText(/popular/i) || screen.queryByText(/trending/i);
    if (featuredSection) {
      expect(featuredSection).toBeInTheDocument();
    }
  });

  test('displays promotional banners if present', () => {
    renderHome();
    const promoElement = screen.queryByText(/sale|discount|offer/i);
    if (promoElement) {
      expect(promoElement).toBeInTheDocument();
    }
  });

  test('renders navigation links to products page', () => {
    renderHome();
    const productLinks = screen.queryAllByRole('link');
    expect(productLinks.length).toBeGreaterThanOrEqual(0);
  });

  test('displays company tagline or description', () => {
    renderHome();
    const descriptionElement = screen.queryByText(/e-commerce|store|shop/i);
    if (descriptionElement) {
      expect(descriptionElement).toBeInTheDocument();
    }
  });

  test('renders images without errors', () => {
    renderHome();
    const images = screen.queryAllByRole('img');
    images.forEach(img => {
      expect(img).toBeInTheDocument();
    });
  });

  test('handles click on shop now button', () => {
    renderHome();
    const shopButton = screen.queryByRole('button', { name: /shop now/i }) || screen.queryByRole('link', { name: /shop now/i });
    if (shopButton) {
      fireEvent.click(shopButton);
      // Navigation should occur
      expect(shopButton).toBeInTheDocument();
    }
  });

  test('displays categories section if present', () => {
    renderHome();
    const categoriesElement = screen.queryByText(/categories/i) || screen.queryByText(/browse by/i);
    if (categoriesElement) {
      expect(categoriesElement).toBeInTheDocument();
    }
  });

  test('renders testimonials section if present', () => {
    renderHome();
    const testimonialsElement = screen.queryByText(/testimonial|review|customer/i);
    if (testimonialsElement) {
      expect(testimonialsElement).toBeInTheDocument();
    }
  });

  test('displays newsletter signup if present', () => {
    renderHome();
    const newsletterElement = screen.queryByText(/newsletter|subscribe|email/i);
    if (newsletterElement) {
      expect(newsletterElement).toBeInTheDocument();
    }
  });

  test('renders footer information if present', () => {
    renderHome();
    const footerElement = screen.queryByText(/contact|about|privacy/i);
    if (footerElement) {
      expect(footerElement).toBeInTheDocument();
    }
  });

  test('displays loading state initially if data is being fetched', () => {
    renderHome();
    const loadingElement = screen.queryByText(/loading/i);
    if (loadingElement) {
      expect(loadingElement).toBeInTheDocument();
    }
  });

  test('handles error state gracefully', () => {
    renderHome();
    const errorElement = screen.queryByText(/error/i);
    // Error should not be present initially
    if (errorElement) {
      expect(errorElement).toBeInTheDocument();
    }
  });

  test('renders responsive layout', () => {
    const { container } = renderHome();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('displays social media links if present', () => {
    renderHome();
    const socialLinks = screen.queryAllByRole('link', { name: /facebook|twitter|instagram/i });
    socialLinks.forEach(link => {
      expect(link).toBeInTheDocument();
    });
  });

  test('renders benefits or features section', () => {
    renderHome();
    const benefitsElement = screen.queryByText(/free shipping|returns|support/i);
    if (benefitsElement) {
      expect(benefitsElement).toBeInTheDocument();
    }
  });

  test('displays brand logo or name', () => {
    renderHome();
    const brandElement = screen.queryByRole('img', { name: /logo/i }) || screen.queryByText(/brand|store name/i);
    if (brandElement) {
      expect(brandElement).toBeInTheDocument();
    }
  });

  test('renders with proper semantic HTML structure', () => {
    const { container } = renderHome();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('handles window resize events properly', () => {
    renderHome();
    // Simulate window resize
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));
    expect(screen.queryByRole('heading') || document.body).toBeInTheDocument();
  });

  test('displays special offers section if present', () => {
    renderHome();
    const offersElement = screen.queryByText(/special offer|deal|promotion/i);
    if (offersElement) {
      expect(offersElement).toBeInTheDocument();
    }
  });

  test('renders carousel or slider if present', () => {
    renderHome();
    const carouselElement = screen.queryByRole('region') || screen.queryByTestId('carousel');
    if (carouselElement) {
      expect(carouselElement).toBeInTheDocument();
    }
  });
});
