import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to E-Shop</h1>
          <p className="hero-subtitle">Discover amazing products at great prices</p>
          <Link to="/products" className="hero-btn">
            Shop Now
          </Link>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <div className="feature-icon">🚚</div>
          <h3>Free Shipping</h3>
          <p>On orders over $50</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💳</div>
          <h3>Secure Payment</h3>
          <p>100% secure transactions</p>
        </div>
        <div className="feature">
          <div className="feature-icon">↩️</div>
          <h3>Easy Returns</h3>
          <p>30-day return policy</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⭐</div>
          <h3>Quality Products</h3>
          <p>Carefully curated selection</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
