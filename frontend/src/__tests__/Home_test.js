import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Home from '../components/Home';

const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  test('renders Home component successfully', () => {
    renderWithRouter();
    expect(screen.getByText(/welcome to aava e-commerce/i)).toBeInTheDocument();
  });

  test('displays hero section with welcome heading', () => {
    renderWithRouter();
    const heading = screen.getByText(/welcome to aava e-commerce/i);
    expect(heading).toBeInTheDocument();
  });

  test('displays hero section description text', () => {
    renderWithRouter();
    const description = screen.getByText(/discover amazing products at great prices/i);
    expect(description).toBeInTheDocument();
  });

  test('displays Shop Now button in hero section', () => {
    renderWithRouter();
    const shopNowButton = screen.getByText(/shop now/i);
    expect(shopNowButton).toBeInTheDocument();
  });

  test('displays features section', () => {
    renderWithRouter();
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
  });

  test('displays Free Shipping feature', () => {
    renderWithRouter();
    const freeShipping = screen.getByText(/free shipping/i);
    expect(freeShipping).toBeInTheDocument();
  });

  test('displays Secure Payment feature', () => {
    renderWithRouter();
    const securePayment = screen.getByText(/secure payment/i);
    expect(securePayment).toBeInTheDocument();
  });

  test('displays Easy Returns feature', () => {
    renderWithRouter();
    const easyReturns = screen.getByText(/easy returns/i);
    expect(easyReturns).toBeInTheDocument();
  });

  test('displays Quality Products feature', () => {
    renderWithRouter();
    const qualityProducts = screen.getByText(/quality products/i);
    expect(qualityProducts).toBeInTheDocument();
  });

  test('verifies all 4 features are present', () => {
    renderWithRouter();
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
    expect(screen.getByText(/easy returns/i)).toBeInTheDocument();
    expect(screen.getByText(/quality products/i)).toBeInTheDocument();
  });

  test('Shop Now button is clickable', () => {
    renderWithRouter();
    const shopNowButton = screen.getByText(/shop now/i);
    expect(shopNowButton).toBeEnabled();
  });

  test('validates hero section structure', () => {
    const { container } = renderWithRouter();
    expect(container.querySelector('.hero-section') || container.querySelector('[class*="hero"]')).toBeTruthy();
  });

  test('validates features section structure', () => {
    const { container } = renderWithRouter();
    expect(container.querySelector('.features-section') || container.querySelector('[class*="feature"]')).toBeTruthy();
  });

  test('snapshot test for Home component', () => {
    const { container } = renderWithRouter();
    expect(container).toMatchSnapshot();
  });
});
