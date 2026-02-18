import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';
import { useNavigate } from 'react-router-dom';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Home Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders main heading', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome to AAVA E-Commerce')).toBeInTheDocument();
  });

  test('renders subheading', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Discover amazing products at great prices')).toBeInTheDocument();
  });

  test('renders Shop Now button', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Shop Now')).toBeInTheDocument();
  });

  test('renders Free Shipping feature', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    expect(screen.getByText('On orders over $50')).toBeInTheDocument();
  });

  test('renders Secure Payment feature', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText('100% secure transactions')).toBeInTheDocument();
  });

  test('renders Easy Returns feature', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Easy Returns')).toBeInTheDocument();
    expect(screen.getByText('30-day return policy')).toBeInTheDocument();
  });

  test('renders Quality Products feature', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Quality Products')).toBeInTheDocument();
    expect(screen.getByText('Top-rated items')).toBeInTheDocument();
  });

  test('renders all four features', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText('Easy Returns')).toBeInTheDocument();
    expect(screen.getByText('Quality Products')).toBeInTheDocument();
  });

  test('Shop Now button is clickable', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const shopNowButton = screen.getByText('Shop Now');
    expect(shopNowButton).toBeInTheDocument();
    fireEvent.click(shopNowButton);
  });

  test('validates DOM structure with heading and subheading', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const heading = screen.getByText('Welcome to AAVA E-Commerce');
    const subheading = screen.getByText('Discover amazing products at great prices');

    expect(heading).toBeInTheDocument();
    expect(subheading).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });
});
