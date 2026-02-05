import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Products from './components/Products';
import Cart from './components/Cart';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // If product already in cart, increase quantity
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new product to cart
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Show notification
    alert(`${product.name} added to cart!`);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  return (
    <Router>
      <div className="App">
        <Navbar cart={cart} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/products" 
            element={<Products onAddToCart={handleAddToCart} />} 
          />
          <Route 
            path="/cart" 
            element={
              <Cart 
                cart={cart} 
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
