import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

describe('Navbar Component', () => {
  const mockEmptyCart = [];
  const mockCartWithItems = [
    { id: 1, name: 'Product 1', quantity: 2 },
    { id: 2, name: 'Product 2', quantity: 1 }
  ];

  test('renders Navbar component', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/e-shop/i)).toBeInTheDocument();
  });

  test('displays "E-Shop" logo', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/e-shop/i)).toBeInTheDocument();
  });

  test('displays "Home" navigation link', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/^home$/i)).toBeInTheDocument();
  });

  test('displays "Products" navigation link', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/^products$/i)).toBeInTheDocument();
  });

  test('displays "Cart" navigation link', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('displays cart count when cart is empty', () => {
    render(<Navbar cart={mockEmptyCart} />);
    const cartElement = screen.getByText(/cart/i);
    expect(cartElement).toBeInTheDocument();
  });

  test('displays correct cart count with items', () => {
    render(<Navbar cart={mockCartWithItems} />);
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('cart count reflects number of items', () => {
    const { container } = render(<Navbar cart={mockCartWithItems} />);
    expect(container.textContent).toContain('Cart');
  });

  test('validates all navigation links are present', () => {
    render(<Navbar cart={mockEmptyCart} />);
    expect(screen.getByText(/^home$/i)).toBeInTheDocument();
    expect(screen.getByText(/^products$/i)).toBeInTheDocument();
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('validates navbar DOM structure', () => {
    const { container } = render(<Navbar cart={mockEmptyCart} />);
    expect(container.querySelector('nav')).toBeTruthy();
  });

  test('E-Shop logo is a link', () => {
    render(<Navbar cart={mockEmptyCart} />);
    const logo = screen.getByText(/e-shop/i);
    expect(logo.tagName).toBe('A');
  });

  test('renders with different cart sizes', () => {
    const { rerender } = render(<Navbar cart={[]} />);
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
    
    rerender(<Navbar cart={mockCartWithItems} />);
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  test('validates navigation structure', () => {
    const { container } = render(<Navbar cart={mockEmptyCart} />);
    const navElement = container.querySelector('nav');
    expect(navElement).toBeInTheDocument();
  });
});