# Low Level Design (LLD) Document

## Project: E-Commerce Platform - Shopping Cart Feature

### Version: 2.0
### Date: 2024-01-15
### Author: Development Team

---

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Database Schema](#database-schema)
7. [Sequence Diagrams](#sequence-diagrams)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

---

## 1. Introduction

### 1.1 Purpose
This Low Level Design document provides detailed technical specifications for implementing the Shopping Cart feature in the e-commerce platform. It covers frontend components, backend services, database design, and API contracts.

### 1.2 Scope
The shopping cart feature allows users to:
- Add products to cart
- Update product quantities
- Remove products from cart
- View cart summary with pricing
- Proceed to checkout

### 1.3 Technology Stack
- **Frontend**: React.js, Redux, TypeScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ

---

## 2. System Architecture

### 2.1 High-Level Architecture

```mermaid
graph TB
    A[Client Browser] --> B[React Frontend]
    B --> C[API Gateway]
    C --> D[Shopping Cart Service]
    C --> E[Product Service]
    C --> F[User Service]
    D --> G[PostgreSQL Database]
    D --> H[Redis Cache]
    D --> I[RabbitMQ]
    I --> J[Inventory Service]
    I --> K[Pricing Service]
```

### 2.2 Component Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Gateway
    participant CS as Cart Service
    participant DB as Database
    participant Cache as Redis
    
    U->>F: Add item to cart
    F->>API: POST /api/cart/items
    API->>CS: Process request
    CS->>Cache: Check cart cache
    CS->>DB: Update cart
    DB-->>CS: Confirmation
    CS->>Cache: Update cache
    CS-->>API: Success response
    API-->>F: Cart updated
    F-->>U: Display updated cart
```

---

## 3. Component Design

### 3.1 Frontend Components

#### 3.1.1 Shopping Cart Component

**File**: `src/components/ShoppingCart/ShoppingCart.tsx`

**Purpose**: Main container component for the shopping cart interface

**Props**:
```typescript
interface ShoppingCartProps {
  userId: string;
  onCheckout: () => void;
  onContinueShopping: () => void;
}
```

**State Management**:
```typescript
interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  loading: boolean;
  error: string | null;
}
```

**Key Methods**:
- `fetchCart()`: Retrieves cart data from backend
- `updateQuantity(itemId: string, quantity: number)`: Updates item quantity
- `removeItem(itemId: string)`: Removes item from cart
- `calculateTotals()`: Computes cart totals
- `handleCheckout()`: Initiates checkout process

**Implementation**:
```typescript
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartItems, updateCartItem, removeCartItem } from '../../store/actions/cartActions';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import EmptyCart from './EmptyCart';

const ShoppingCart: React.FC<ShoppingCartProps> = ({ userId, onCheckout, onContinueShopping }) => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state: RootState) => state.cart);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shipping: 0, total: 0 });

  useEffect(() => {
    dispatch(fetchCartItems(userId));
  }, [userId, dispatch]);

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    setTotals({ subtotal, tax, shipping, total });
  };

  const handleQuantityUpdate = (itemId: string, quantity: number) => {
    dispatch(updateCartItem(itemId, quantity));
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeCartItem(itemId));
  };

  if (loading) return <div className="loading-spinner">Loading cart...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (items.length === 0) return <EmptyCart onContinueShopping={onContinueShopping} redirectLink="/products" />;

  return (
    <div className="shopping-cart-container">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityUpdate}
            onRemove={handleRemoveItem}
          />
        ))}
      </div>
      <CartSummary totals={totals} onCheckout={onCheckout} />
    </div>
  );
};

export default ShoppingCart;
```

**MODIFICATION APPLIED**: Added explicit UI redirection link in empty cart view to 'continue shopping' by passing `redirectLink="/products"` to the EmptyCart component.

---

#### 3.1.2 Cart Item Component

**File**: `src/components/ShoppingCart/CartItem.tsx`

**Purpose**: Displays individual cart item with quantity controls

**Props**:
```typescript
interface CartItemProps {
  item: CartItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  maxOrderQuantity: number;
}
```

**Implementation**:
```typescript
import React, { useState } from 'react';
import './CartItem.css';

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = (newQuantity: number) => {
    // MODIFICATION APPLIED: Add UI validation and alert to prevent quantity input exceeding max_order_quantity
    if (newQuantity > item.maxOrderQuantity) {
      setError(`Quantity cannot exceed maximum order limit of ${item.maxOrderQuantity}`);
      alert(`Error: Maximum order quantity for this item is ${item.maxOrderQuantity}. Please enter a valid quantity.`);
      return;
    }
    
    if (newQuantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    
    setError(null);
    setQuantity(newQuantity);
    onQuantityChange(item.id, newQuantity);
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleQuantityChange(value);
    }
  };

  return (
    <div className="cart-item">
      <img src={item.imageUrl} alt={item.name} className="item-image" />
      <div className="item-details">
        <h3>{item.name}</h3>
        <p className="item-price">${item.price.toFixed(2)}</p>
      </div>
      <div className="quantity-controls">
        <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          min="1"
          max={item.maxOrderQuantity}
        />
        <button onClick={incrementQuantity}>+</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="item-total">
        <p>${(item.price * quantity).toFixed(2)}</p>
      </div>
      <button onClick={() => onRemove(item.id)} className="remove-button">
        Remove
      </button>
    </div>
  );
};

export default CartItem;
```

---

#### 3.1.3 Cart Summary Component

**File**: `src/components/ShoppingCart/CartSummary.tsx`

**Purpose**: Displays cart totals and checkout button

**Props**:
```typescript
interface CartSummaryProps {
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  onCheckout: () => void;
}
```

**Implementation**:
```typescript
import React from 'react';
import './CartSummary.css';

const CartSummary: React.FC<CartSummaryProps> = ({ totals, onCheckout }) => {
  return (
    <div className="cart-summary">
      <h3>Order Summary</h3>
      <div className="summary-row">
        <span>Subtotal:</span>
        <span>${totals.subtotal.toFixed(2)}</span>
      </div>
      <div className="summary-row">
        <span>Tax:</span>
        <span>${totals.tax.toFixed(2)}</span>
      </div>
      <div className="summary-row">
        <span>Shipping:</span>
        <span>{totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}</span>
      </div>
      <div className="summary-row total">
        <span>Total:</span>
        <span>${totals.total.toFixed(2)}</span>
      </div>
      <button onClick={onCheckout} className="checkout-button">
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;
```

---

#### 3.1.4 Empty Cart Component

**File**: `src/components/ShoppingCart/EmptyCart.tsx`

**Purpose**: Displays message when cart is empty

**Props**:
```typescript
interface EmptyCartProps {
  onContinueShopping: () => void;
  redirectLink?: string;
}
```

**Implementation**:
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyCart.css';

const EmptyCart: React.FC<EmptyCartProps> = ({ onContinueShopping, redirectLink = '/products' }) => {
  return (
    <div className="empty-cart">
      <div className="empty-cart-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Add some items to get started!</p>
      <Link to={redirectLink} className="continue-shopping-link">
        <button onClick={onContinueShopping} className="continue-shopping-button">
          Continue Shopping
        </button>
      </Link>
    </div>
  );
};

export default EmptyCart;
```

---

### 3.2 Backend Components

#### 3.2.1 Shopping Cart Controller

**File**: `src/controllers/cartController.js`

**Purpose**: Handles HTTP requests for cart operations

**Endpoints**:
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update item quantity
- `DELETE /api/cart/items/:itemId` - Remove item from cart
- `DELETE /api/cart/:userId` - Clear entire cart

**Implementation**:
```javascript
const CartService = require('../services/cartService');
const ProductService = require('../services/productService');
const { validateCartItem, validateQuantityUpdate } = require('../validators/cartValidator');
const logger = require('../utils/logger');

class CartController {
  /**
   * Get user's shopping cart
   * @route GET /api/cart/:userId
   */
  async getCart(req, res) {
    try {
      const { userId } = req.params;
      
      logger.info(`Fetching cart for user: ${userId}`);
      const cart = await CartService.getCartByUserId(userId);
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error fetching cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch cart',
        error: error.message
      });
    }
  }

  /**
   * Add item to cart
   * @route POST /api/cart/items
   */
  async addItem(req, res) {
    try {
      const { userId, productId, quantity } = req.body;
      
      // Validate input
      const validation = validateCartItem(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }
      
      // Check product availability
      const product = await ProductService.getProductById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      
      // Add item to cart
      const cartItem = await CartService.addItemToCart(userId, productId, quantity);
      
      logger.info(`Item added to cart: ${cartItem.id}`);
      return res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: cartItem
      });
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message
      });
    }
  }

  /**
   * Update cart item quantity
   * @route PUT /api/cart/items/:itemId
   */
  async updateItemQuantity(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      // Validate quantity
      const validation = validateQuantityUpdate({ quantity });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity',
          errors: validation.errors
        });
      }
      
      // Get cart item to check product details
      const cartItem = await CartService.getCartItemById(itemId);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }
      
      // MODIFICATION APPLIED: Validate that updated quantity does not exceed product's max_order_quantity
      const product = await ProductService.getProductById(cartItem.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      if (quantity > product.maxOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Quantity exceeds maximum order limit of ${product.maxOrderQuantity} for this product`
        });
      }
      
      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      
      // Update quantity
      const updatedItem = await CartService.updateItemQuantity(itemId, quantity);
      
      logger.info(`Cart item quantity updated: ${itemId}`);
      return res.status(200).json({
        success: true,
        message: 'Quantity updated',
        data: updatedItem
      });
    } catch (error) {
      logger.error('Error updating cart item quantity:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update quantity',
        error: error.message
      });
    }
  }

  /**
   * Remove item from cart
   * @route DELETE /api/cart/items/:itemId
   */
  async removeItem(req, res) {
    try {
      const { itemId } = req.params;
      
      await CartService.removeItemFromCart(itemId);
      
      logger.info(`Item removed from cart: ${itemId}`);
      return res.status(200).json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove item',
        error: error.message
      });
    }
  }

  /**
   * Clear entire cart
   * @route DELETE /api/cart/:userId
   */
  async clearCart(req, res) {
    try {
      const { userId } = req.params;
      
      await CartService.clearCart(userId);
      
      logger.info(`Cart cleared for user: ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'Cart cleared'
      });
    } catch (error) {
      logger.error('Error clearing cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error.message
      });
    }
  }
}

module.exports = new CartController();
```

---

#### 3.2.2 Shopping Cart Service

**File**: `src/services/cartService.js`

**Purpose**: Business logic for cart operations

**Implementation**:
```javascript
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const redisClient = require('../config/redis');
const { publishEvent } = require('../utils/messageQueue');
const logger = require('../utils/logger');

class CartService {
  /**
   * Get cart by user ID
   */
  async getCartByUserId(userId) {
    try {
      // Check cache first
      const cacheKey = `cart:${userId}`;
      const cachedCart = await redisClient.get(cacheKey);
      
      if (cachedCart) {
        logger.info(`Cart retrieved from cache for user: ${userId}`);
        return JSON.parse(cachedCart);
      }
      
      // Fetch from database
      const cart = await Cart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      });
      
      if (cart) {
        // Cache the result
        await redisClient.setex(cacheKey, 3600, JSON.stringify(cart));
      }
      
      return cart;
    } catch (error) {
      logger.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Get cart item by ID
   */
  async getCartItemById(itemId) {
    try {
      const cartItem = await CartItem.findByPk(itemId, {
        include: [{
          model: Product,
          as: 'product'
        }]
      });
      return cartItem;
    } catch (error) {
      logger.error('Error fetching cart item:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItemToCart(userId, productId, quantity) {
    try {
      // Get or create cart
      let cart = await Cart.findOne({ where: { userId } });
      
      if (!cart) {
        cart = await Cart.create({ userId });
      }
      
      // Check if item already exists in cart
      let cartItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId
        }
      });
      
      if (cartItem) {
        // Update quantity
        cartItem.quantity += quantity;
        await cartItem.save();
      } else {
        // Create new cart item
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          quantity
        });
      }
      
      // Invalidate cache
      await this.invalidateCartCache(userId);
      
      // Publish event
      await publishEvent('cart.item.added', {
        userId,
        productId,
        quantity,
        timestamp: new Date()
      });
      
      return cartItem;
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(itemId, quantity) {
    try {
      const cartItem = await CartItem.findByPk(itemId, {
        include: [{
          model: Cart,
          as: 'cart'
        }]
      });
      
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
      
      cartItem.quantity = quantity;
      await cartItem.save();
      
      // MODIFICATION APPLIED: Add explicit logic for recalculation of subtotal and total whenever cart item quantity changes
      const cart = await this.getCartByUserId(cartItem.cart.userId);
      const recalculatedTotals = await this.recalculateCartTotals(cart);
      
      // Update cart with new totals
      await Cart.update(
        {
          subtotal: recalculatedTotals.subtotal,
          total: recalculatedTotals.total
        },
        {
          where: { id: cart.id }
        }
      );
      
      // Invalidate cache
      await this.invalidateCartCache(cartItem.cart.userId);
      
      // Publish event
      await publishEvent('cart.item.updated', {
        itemId,
        quantity,
        userId: cartItem.cart.userId,
        subtotal: recalculatedTotals.subtotal,
        total: recalculatedTotals.total,
        timestamp: new Date()
      });
      
      return cartItem;
    } catch (error) {
      logger.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  /**
   * Recalculate cart totals
   */
  async recalculateCartTotals(cart) {
    try {
      let subtotal = 0;
      
      for (const item of cart.items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          subtotal += product.price * item.quantity;
        }
      }
      
      const tax = subtotal * 0.08; // 8% tax rate
      const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
      const total = subtotal + tax + shipping;
      
      return {
        subtotal,
        tax,
        shipping,
        total
      };
    } catch (error) {
      logger.error('Error recalculating cart totals:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(itemId) {
    try {
      const cartItem = await CartItem.findByPk(itemId, {
        include: [{
          model: Cart,
          as: 'cart'
        }]
      });
      
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
      
      const userId = cartItem.cart.userId;
      
      await cartItem.destroy();
      
      // Invalidate cache
      await this.invalidateCartCache(userId);
      
      // Publish event
      await publishEvent('cart.item.removed', {
        itemId,
        userId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ where: { userId } });
      
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      await CartItem.destroy({ where: { cartId: cart.id } });
      
      // Invalidate cache
      await this.invalidateCartCache(userId);
      
      // Publish event
      await publishEvent('cart.cleared', {
        userId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Invalidate cart cache
   */
  async invalidateCartCache(userId) {
    try {
      const cacheKey = `cart:${userId}`;
      await redisClient.del(cacheKey);
      logger.info(`Cart cache invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating cart cache:', error);
      // Don't throw error, just log it
    }
  }
}

module.exports = new CartService();
```

---

#### 3.2.3 Cart Validator

**File**: `src/validators/cartValidator.js`

**Purpose**: Validates cart-related requests

**Implementation**:
```javascript
const Joi = require('joi');

class CartValidator {
  validateCartItem(data) {
    const schema = Joi.object({
      userId: Joi.string().uuid().required(),
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).max(100).required()
    });
    
    const { error } = schema.validate(data);
    
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }
    
    return { isValid: true };
  }
  
  validateQuantityUpdate(data) {
    const schema = Joi.object({
      quantity: Joi.number().integer().min(1).max(100).required()
    });
    
    const { error } = schema.validate(data);
    
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }
    
    return { isValid: true };
  }
}

module.exports = new CartValidator();
```

---

## 4. Data Models

### 4.1 Cart Model

**File**: `src/models/Cart.js`

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'carts',
  timestamps: true
});

module.exports = Cart;
```

### 4.2 CartItem Model

**File**: `src/models/CartItem.js`

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cartId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Carts',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cart_items',
  timestamps: true
});

module.exports = CartItem;
```

### 4.3 Model Associations

**File**: `src/models/index.js`

```javascript
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Product = require('./Product');
const User = require('./User');

// Cart - User relationship
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });

// Cart - CartItem relationship
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

// CartItem - Product relationship
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });

module.exports = {
  Cart,
  CartItem,
  Product,
  User
};
```

---

## 5. API Specifications

### 5.1 Get Cart

**Endpoint**: `GET /api/cart/:userId`

**Description**: Retrieves the shopping cart for a specific user

**Request Parameters**:
- `userId` (path parameter): UUID of the user

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "items": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "name": "Product Name",
        "price": 29.99,
        "quantity": 2,
        "imageUrl": "https://example.com/image.jpg",
        "maxOrderQuantity": 10
      }
    ],
    "subtotal": 59.98,
    "tax": 4.80,
    "shipping": 0.00,
    "total": 64.78,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5.2 Add Item to Cart

**Endpoint**: `POST /api/cart/items`

**Description**: Adds a new item to the cart or updates quantity if item exists

**Request Body**:
```json
{
  "userId": "user-uuid",
  "productId": "product-uuid",
  "quantity": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 1,
    "price": 29.99,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 5.3 Update Item Quantity

**Endpoint**: `PUT /api/cart/items/:itemId`

**Description**: Updates the quantity of a cart item

**Request Parameters**:
- `itemId` (path parameter): UUID of the cart item

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response**:
```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    "id": "item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 3,
    "price": 29.99,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5.4 Remove Item from Cart

**Endpoint**: `DELETE /api/cart/items/:itemId`

**Description**: Removes an item from the cart

**Request Parameters**:
- `itemId` (path parameter): UUID of the cart item

**Response**:
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

### 5.5 Clear Cart

**Endpoint**: `DELETE /api/cart/:userId`

**Description**: Removes all items from the user's cart

**Request Parameters**:
- `userId` (path parameter): UUID of the user

**Response**:
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## 6. Database Schema

### 6.1 Carts Table

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subtotal DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
```

### 6.2 Cart Items Table

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

### 6.3 Products Table (Reference)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  max_order_quantity INTEGER NOT NULL DEFAULT 10,
  image_url VARCHAR(500),
  category_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
```

---

## 7. Sequence Diagrams

### 7.1 Add Item to Cart Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Gateway
    participant Cart Controller
    participant Cart Service
    participant Product Service
    participant Database
    participant Redis Cache
    participant RabbitMQ
    
    User->>Frontend: Click "Add to Cart"
    Frontend->>API Gateway: POST /api/cart/items
    API Gateway->>Cart Controller: Forward request
    Cart Controller->>Cart Controller: Validate input
    Cart Controller->>Product Service: Check product availability
    Product Service->>Database: Query product
    Database-->>Product Service: Product data
    Product Service-->>Cart Controller: Product available
    Cart Controller->>Cart Service: Add item to cart
    Cart Service->>Database: Check existing cart
    Database-->>Cart Service: Cart data
    Cart Service->>Database: Insert/Update cart item
    Database-->>Cart Service: Success
    Cart Service->>Redis Cache: Invalidate cart cache
    Cart Service->>RabbitMQ: Publish cart.item.added event
    Cart Service-->>Cart Controller: Cart item created
    Cart Controller-->>API Gateway: Success response
    API Gateway-->>Frontend: Cart updated
    Frontend-->>User: Show success message
```

### 7.2 Update Item Quantity Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Gateway
    participant Cart Controller
    participant Cart Service
    participant Product Service
    participant Database
    participant Redis Cache
    
    User->>Frontend: Change quantity
    Frontend->>Frontend: Validate max_order_quantity
    alt Quantity exceeds limit
        Frontend-->>User: Show error alert
    else Valid quantity
        Frontend->>API Gateway: PUT /api/cart/items/:itemId
        API Gateway->>Cart Controller: Forward request
        Cart Controller->>Cart Controller: Validate quantity
        Cart Controller->>Cart Service: Get cart item
        Cart Service->>Database: Query cart item
        Database-->>Cart Service: Cart item data
        Cart Service-->>Cart Controller: Cart item
        Cart Controller->>Product Service: Get product details
        Product Service->>Database: Query product
        Database-->>Product Service: Product data
        Product Service-->>Cart Controller: Product with max_order_quantity
        Cart Controller->>Cart Controller: Validate against max_order_quantity
        alt Exceeds max_order_quantity
            Cart Controller-->>API Gateway: Error response
            API Gateway-->>Frontend: Validation error
            Frontend-->>User: Show error message
        else Valid update
            Cart Controller->>Cart Service: Update quantity
            Cart Service->>Database: Update cart item
            Database-->>Cart Service: Success
            Cart Service->>Cart Service: Recalculate totals
            Cart Service->>Database: Update cart totals
            Cart Service->>Redis Cache: Invalidate cache
            Cart Service-->>Cart Controller: Updated item
            Cart Controller-->>API Gateway: Success response
            API Gateway-->>Frontend: Quantity updated
            Frontend-->>User: Show updated cart
        end
    end
```

### 7.3 Checkout Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Gateway
    participant Cart Service
    participant Order Service
    participant Payment Service
    participant Inventory Service
    participant Database
    
    User->>Frontend: Click "Checkout"
    Frontend->>API Gateway: GET /api/cart/:userId
    API Gateway->>Cart Service: Get cart
    Cart Service->>Database: Query cart with items
    Database-->>Cart Service: Cart data
    Cart Service-->>API Gateway: Cart details
    API Gateway-->>Frontend: Cart summary
    Frontend-->>User: Show checkout page
    User->>Frontend: Confirm order
    Frontend->>API Gateway: POST /api/orders
    API Gateway->>Order Service: Create order
    Order Service->>Inventory Service: Reserve items
    Inventory Service-->>Order Service: Items reserved
    Order Service->>Payment Service: Process payment
    Payment Service-->>Order Service: Payment successful
    Order Service->>Database: Create order
    Database-->>Order Service: Order created
    Order Service->>Cart Service: Clear cart
    Cart Service->>Database: Delete cart items
    Database-->>Cart Service: Success
    Cart Service-->>Order Service: Cart cleared
    Order Service-->>API Gateway: Order confirmation
    API Gateway-->>Frontend: Order success
    Frontend-->>User: Show order confirmation
```

---

## 8. Error Handling

### 8.1 Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| CART_NOT_FOUND | 404 | Cart does not exist for user |
| ITEM_NOT_FOUND | 404 | Cart item not found |
| PRODUCT_NOT_FOUND | 404 | Product does not exist |
| INVALID_QUANTITY | 400 | Quantity is invalid or out of range |
| INSUFFICIENT_STOCK | 400 | Product stock is insufficient |
| MAX_QUANTITY_EXCEEDED | 400 | Quantity exceeds maximum order limit |
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | User is not authenticated |
| FORBIDDEN | 403 | User does not have permission |
| INTERNAL_ERROR | 500 | Internal server error |
| DATABASE_ERROR | 500 | Database operation failed |
| CACHE_ERROR | 500 | Cache operation failed |

### 8.3 Error Handling Implementation

**File**: `src/middleware/errorHandler.js`

```javascript
const logger = require('../utils/logger');

class ErrorHandler {
  handle(err, req, res, next) {
    logger.error('Error occurred:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body
    });
    
    // Default error
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = err.message;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = err.code || 'NOT_FOUND';
      message = err.message;
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
      message = 'Authentication required';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      errorCode = 'FORBIDDEN';
      message = 'Access denied';
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new ErrorHandler();
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

- All cart endpoints require valid JWT authentication
- Users can only access their own cart
- Admin users can view any cart for support purposes

**Middleware**: `src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorizeCartAccess = (req, res, next) => {
  const { userId } = req.params;
  
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

module.exports = { authenticate, authorizeCartAccess };
```

### 9.2 Input Validation

- All inputs are validated using Joi schemas
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### 9.3 Rate Limiting

**Middleware**: `src/middleware/rateLimit.js`

```javascript
const rateLimit = require('express-rate-limit');

const cartRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { cartRateLimiter };
```

### 9.4 Data Encryption

- All API communication over HTTPS
- Sensitive data encrypted at rest
- JWT tokens for secure session management

---

## 10. Performance Optimization

### 10.1 Caching Strategy

**Redis Cache Implementation**:

- Cart data cached for 1 hour
- Cache invalidation on cart updates
- Cache-aside pattern for read operations

```javascript
// Cache configuration
const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'cart:';

// Cache key generation
const getCacheKey = (userId) => `${CACHE_PREFIX}${userId}`;
```

### 10.2 Database Optimization

**Indexes**:
- `idx_carts_user_id` on carts.user_id
- `idx_cart_items_cart_id` on cart_items.cart_id
- `idx_cart_items_product_id` on cart_items.product_id

**Query Optimization**:
- Use of eager loading for related data
- Pagination for large result sets
- Connection pooling

```javascript
// Database connection pool configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});
```

### 10.3 API Response Optimization

- Gzip compression enabled
- Response pagination
- Field selection to reduce payload size

```javascript
// Compression middleware
const compression = require('compression');
app.use(compression());
```

### 10.4 Asynchronous Processing

**Message Queue Integration**:

- Cart events published to RabbitMQ
- Asynchronous inventory updates
- Non-blocking operations

```javascript
// RabbitMQ configuration
const amqp = require('amqplib');

class MessageQueue {
  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('cart_events', 'topic', { durable: true });
  }
  
  async publishEvent(eventType, data) {
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
    
    this.channel.publish(
      'cart_events',
      eventType,
      Buffer.from(message),
      { persistent: true }
    );
  }
}

module.exports = new MessageQueue();
```

---

## Appendix

### A. Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# API
API_VERSION=v1
API_PREFIX=/api
```

### B. Testing Strategy

**Unit Tests**: Test individual functions and methods
**Integration Tests**: Test API endpoints and database interactions
**E2E Tests**: Test complete user flows

**Test Coverage Target**: 80%

### C. Deployment Considerations

- Docker containerization
- Kubernetes orchestration
- CI/CD pipeline with GitHub Actions
- Blue-green deployment strategy
- Health check endpoints
- Monitoring with Prometheus and Grafana

### D. API Documentation

Complete API documentation available at:
- Swagger UI: `/api-docs`
- Postman Collection: Available in repository

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2024-01-10 | Dev Team | Initial version |
| 2.0 | 2024-01-15 | Dev Team | Added modifications per RCA metadata: max_order_quantity validation, cart total recalculation, empty cart redirection |

---

**End of Document**