import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../Home';

describe('Home Component', () => {
  test('renders Home component', () => {
    render(<Home />);
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  test('displays "Welcome to E-Shop" heading', () => {
    render(<Home />);
    expect(screen.getByText(/welcome to e-shop/i)).toBeInTheDocument();
  });

  test('displays hero section description', () => {
    render(<Home />);
    expect(screen.getByText(/discover amazing products at great prices/i)).toBeInTheDocument();
  });

  test('displays "Shop Now" link', () => {
    render(<Home />);
    expect(screen.getByText(/shop now/i)).toBeInTheDocument();
  });

  test('displays "Free Shipping" feature', () => {
    render(<Home />);
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
  });

  test('displays "Secure Payment" feature', () => {
    render(<Home />);
    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
  });

  test('displays "Easy Returns" feature', () => {
    render(<Home />);
    expect(screen.getByText(/easy returns/i)).toBeInTheDocument();
  });

  test('displays "Quality Products" feature', () => {
    render(<Home />);
    expect(screen.getByText(/quality products/i)).toBeInTheDocument();
  });

  test('validates hero section is present', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('.hero')).toBeTruthy();
  });

  test('validates features section is present', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('.features')).toBeTruthy();
  });

  test('Shop Now link has correct attributes', () => {
    render(<Home />);
    const shopNowLink = screen.getByText(/shop now/i);
    expect(shopNowLink).toBeInTheDocument();
    expect(shopNowLink.tagName).toBe('A');
  });

  test('renders all feature sections', () => {
    render(<Home />);
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
    expect(screen.getByText(/easy returns/i)).toBeInTheDocument();
    expect(screen.getByText(/quality products/i)).toBeInTheDocument();
  });

  test('validates DOM structure', () => {
    const { container } = render(<Home />);
    expect(container.firstChild).toBeTruthy();
  });
});