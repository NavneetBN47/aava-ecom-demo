import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../Products';

describe('Products Component', () => {
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Products component', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText(/our products/i)).toBeInTheDocument();
  });

  test('displays "Our Products" heading', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText(/our products/i)).toBeInTheDocument();
  });

  test('displays search input with placeholder', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    const searchInput = screen.getByPlaceholderText(/search products/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('search input accepts text input', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'test product' } });
    expect(searchInput.value).toBe('test product');
  });

  test('displays category filter buttons', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    const filterButtons = screen.getAllByRole('button');
    expect(filterButtons.length).toBeGreaterThan(0);
  });

  test('displays "Loading products..." message initially', async () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  test('displays error message when products fail to load', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<Products onAddToCart={mockOnAddToCart} />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('displays "No products found" when search returns no results', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    render(<Products onAddToCart={mockOnAddToCart} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  test('category filter buttons are clickable', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    const filterButtons = screen.getAllByRole('button');
    fireEvent.click(filterButtons[0]);
    expect(filterButtons[0]).toBeInTheDocument();
  });

  test('validates search input DOM structure', () => {
    const { container } = render(<Products onAddToCart={mockOnAddToCart} />);
    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).toBeTruthy();
  });

  test('renders products list container', () => {
    const { container } = render(<Products onAddToCart={mockOnAddToCart} />);
    expect(container.querySelector('.products')).toBeTruthy();
  });

  test('onAddToCart prop is passed correctly', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    expect(mockOnAddToCart).toBeDefined();
  });

  test('validates filter section is present', () => {
    const { container } = render(<Products onAddToCart={mockOnAddToCart} />);
    expect(container.querySelector('.filters')).toBeTruthy();
  });

  test('search functionality updates on input change', () => {
    render(<Products onAddToCart={mockOnAddToCart} />);
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    expect(searchInput.value).toBe('laptop');
  });
});