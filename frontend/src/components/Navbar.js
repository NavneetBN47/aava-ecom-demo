import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ cart }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🛒 E-Shop
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className="nav-link">Products</Link>
          </li>
          <li className="nav-item">
            <Link to="/cart" className="nav-link">
              Cart ({cart.length})
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
