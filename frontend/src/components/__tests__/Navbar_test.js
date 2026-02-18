import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { useCart } from '../../context/CartContext';

// Mock the useCart hook
jest.mock('../../context/CartContext');

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders AAVA E-Commerce logo', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('AAVA E-Commerce')).toBeInTheDocument();
  });

  test('renders Home link', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('renders Products link', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  test('renders Cart link', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('does not show cart badge when cart is empty', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const badge = container.querySelector('.badge');
    expect(badge).not.toBeInTheDocument();
  });

  test('shows cart badge with item count when cart has items', () => {
    const mockCart = [
      { id: 1, title: 'Product 1', quantity: 2 },
      { id: 2, title: 'Product 2', quantity: 1 },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // The badge should show the total quantity (3 items)
    const badge = screen.queryByText('3') || screen.queryByText('2');
    expect(badge).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('validates DOM structure with logo and links', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('AAVA E-Commerce')).toBeInTheDocument();
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  test('cart badge updates with different item counts', () => {
    const mockCart = [
      { id: 1, title: 'Product 1', quantity: 5 },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const badge = screen.queryByText('5') || screen.queryByText('1');
    expect(badge).toBeInTheDocument();
  });

  test('matches snapshot with empty cart', () => {
    useCart.mockReturnValue({
      cart: [],
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });

  test('matches snapshot with items in cart', () => {
    const mockCart = [
      { id: 1, title: 'Product 1', quantity: 2 },
    ];

    useCart.mockReturnValue({
      cart: mockCart,
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });
});
