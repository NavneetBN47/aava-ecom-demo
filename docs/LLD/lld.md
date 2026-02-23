# Low Level Design Document

## Document Information
- **Project**: E-Commerce Platform
- **Version**: 1.0
- **Last Updated**: 2024-01-15
- **Author**: Development Team
- **Status**: Complete and Ready for Review

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Security Design](#security-design)
7. [Performance Considerations](#performance-considerations)
8. [Deployment Architecture](#deployment-architecture)

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-Commerce Platform. It describes the internal workings of each component, data structures, algorithms, and interfaces.

### 1.2 Scope
This document covers:
- Detailed component architecture
- Database schema and data models
- API endpoints and contracts
- Security implementation details
- Performance optimization strategies
- Deployment configurations

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **JWT**: JSON Web Token
- **ORM**: Object-Relational Mapping
- **CDN**: Content Delivery Network

## 2. System Architecture

### 2.1 Overall Architecture
The system follows a microservices architecture pattern with the following key components:

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │   API   │      │   API   │      │   API   │
   │ Gateway │      │ Gateway │      │ Gateway │
   └────┬────┘      └────┬────┘      └────┬────┘
        │                │                 │
        └────────────────┼─────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │  User   │     │ Product │     │ Order   │
   │ Service │     │ Service │     │ Service │
   └────┬────┘     └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │Database │
                    │ Cluster │
                    └─────────┘
```

### 2.2 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (Primary), Redis (Cache)
- **Message Queue**: RabbitMQ
- **API Gateway**: Kong
- **Container Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana

## 3. Component Design

### 3.1 User Service

#### 3.1.1 Responsibilities
- User registration and authentication
- Profile management
- Password reset and recovery
- Session management

#### 3.1.2 Class Diagram

```javascript
class UserController {
  constructor(userService, authService) {
    this.userService = userService;
    this.authService = authService;
  }

  async register(req, res) {
    // Registration logic
  }

  async login(req, res) {
    // Login logic
  }

  async getProfile(req, res) {
    // Profile retrieval logic
  }

  async updateProfile(req, res) {
    // Profile update logic
  }
}

class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async createUser(userData) {
    // User creation logic
  }

  async findUserByEmail(email) {
    // User lookup logic
  }

  async updateUser(userId, updateData) {
    // User update logic
  }
}

class AuthService {
  constructor(jwtService, passwordService) {
    this.jwtService = jwtService;
    this.passwordService = passwordService;
  }

  async generateToken(user) {
    // Token generation logic
  }

  async verifyToken(token) {
    // Token verification logic
  }

  async hashPassword(password) {
    // Password hashing logic
  }
}
```

#### 3.1.3 Sequence Diagram - User Registration

```
Client          Controller      Service         Repository      Database
  │                 │              │                │              │
  │──Register──────>│              │                │              │
  │                 │──Validate───>│                │              │
  │                 │              │──Check Email──>│              │
  │                 │              │                │──Query──────>│
  │                 │              │                │<─Result─────│
  │                 │              │<──User Exists──│              │
  │                 │              │──Hash Password─>│              │
  │                 │              │──Create User──>│              │
  │                 │              │                │──Insert─────>│
  │                 │              │                │<─Success────│
  │                 │              │<──User Created─│              │
  │                 │<─Success────│                │              │
  │<──Response─────│              │                │              │
```

### 3.2 Product Service

#### 3.2.1 Responsibilities
- Product catalog management
- Inventory tracking
- Product search and filtering
- Category management

#### 3.2.2 Class Structure

```javascript
class ProductController {
  constructor(productService, inventoryService) {
    this.productService = productService;
    this.inventoryService = inventoryService;
  }

  async createProduct(req, res) {
    // Product creation logic
  }

  async getProduct(req, res) {
    // Product retrieval logic
  }

  async updateProduct(req, res) {
    // Product update logic
  }

  async searchProducts(req, res) {
    // Product search logic
  }
}

class ProductService {
  constructor(productRepository, cacheService) {
    this.productRepository = productRepository;
    this.cacheService = cacheService;
  }

  async createProduct(productData) {
    // Product creation with cache invalidation
  }

  async getProductById(productId) {
    // Product retrieval with caching
  }

  async searchProducts(criteria) {
    // Product search with filtering
  }
}

class InventoryService {
  constructor(inventoryRepository, eventPublisher) {
    this.inventoryRepository = inventoryRepository;
    this.eventPublisher = eventPublisher;
  }

  async updateStock(productId, quantity) {
    // Stock update logic
  }

  async checkAvailability(productId, quantity) {
    // Availability check logic
  }
}
```

### 3.3 Shopping Cart Service

#### 3.3.1 Responsibilities
- Shopping cart management
- Cart item addition and removal
- Quantity updates with validation
- **Automatic recalculation of subtotal and total upon any quantity mutation**
- Cart persistence and retrieval

#### 3.3.2 Class Diagram

```mermaid
classDiagram
    class ShoppingCartController {
        -cartService: ShoppingCartService
        +getCart(req, res)
        +addItem(req, res)
        +updateItemQuantity(req, res)
        +removeItem(req, res)
        +clearCart(req, res)
    }

    class ShoppingCartService {
        -cartRepository: CartRepository
        -productRepository: ProductRepository
        +getCartByUserId(userId)
        +addItemToCart(userId, productId, quantity)
        +updateCartItemQuantity(userId, cartItemId, quantity)
        +removeItemFromCart(userId, cartItemId)
        +clearCart(userId)
        +recalculateCartTotals(cart)
    }

    class CartRepository {
        +findByUserId(userId)
        +createCart(cartData)
        +updateCart(cartId, cartData)
        +deleteCart(cartId)
        +addCartItem(cartItem)
        +updateCartItem(cartItemId, cartItemData)
        +removeCartItem(cartItemId)
    }

    class ProductRepository {
        +findById(productId)
        +checkStock(productId, quantity)
        +getMaxOrderQuantity(productId)
    }

    ShoppingCartController --> ShoppingCartService
    ShoppingCartService --> CartRepository
    ShoppingCartService --> ProductRepository
```

#### 3.3.3 Class Structure with Validation

```javascript
class ShoppingCartController {
  constructor(cartService) {
    this.cartService = cartService;
  }

  async addItem(req, res) {
    try {
      const { userId } = req.user;
      const { productId, quantity } = req.body;

      // Validate quantity against max_order_quantity
      const product = await this.cartService.getProduct(productId);
      
      if (quantity > product.max_order_quantity) {
        return res.status(400).json({
          success: false,
          error: 'QUANTITY_EXCEEDS_LIMIT',
          message: `Quantity cannot exceed ${product.max_order_quantity} units`,
          maxAllowed: product.max_order_quantity
        });
      }

      const cart = await this.cartService.addItemToCart(userId, productId, quantity);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateItemQuantity(req, res) {
    try {
      const { userId } = req.user;
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      // **MODIFIED: Validate that updated quantity does not exceed max_order_quantity**
      const cartItem = await this.cartService.getCartItem(cartItemId);
      const product = await this.cartService.getProduct(cartItem.productId);
      
      if (quantity > product.max_order_quantity) {
        return res.status(400).json({
          success: false,
          error: 'QUANTITY_EXCEEDS_LIMIT',
          message: `Quantity cannot exceed ${product.max_order_quantity} units for this product`,
          maxAllowed: product.max_order_quantity,
          currentQuantity: cartItem.quantity
        });
      }

      if (quantity < product.min_order_quantity) {
        return res.status(400).json({
          success: false,
          error: 'QUANTITY_BELOW_MINIMUM',
          message: `Quantity must be at least ${product.min_order_quantity} units`,
          minRequired: product.min_order_quantity
        });
      }

      const cart = await this.cartService.updateCartItemQuantity(userId, cartItemId, quantity);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async removeItem(req, res) {
    try {
      const { userId } = req.user;
      const { cartItemId } = req.params;

      const cart = await this.cartService.removeItemFromCart(userId, cartItemId);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCart(req, res) {
    try {
      const { userId } = req.user;
      const cart = await this.cartService.getCartByUserId(userId);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

class ShoppingCartService {
  constructor(cartRepository, productRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  async getCartByUserId(userId) {
    let cart = await this.cartRepository.findByUserId(userId);
    
    if (!cart) {
      cart = await this.cartRepository.createCart({ userId, items: [] });
    }
    
    // Recalculate totals before returning
    cart = await this.recalculateCartTotals(cart);
    
    return cart;
  }

  async addItemToCart(userId, productId, quantity) {
    const product = await this.productRepository.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Check stock availability
    const stockAvailable = await this.productRepository.checkStock(productId, quantity);
    if (!stockAvailable) {
      throw new Error('Insufficient stock');
    }

    let cart = await this.getCartByUserId(userId);
    
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      await this.cartRepository.updateCartItem(existingItem.id, existingItem);
    } else {
      const cartItem = {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.price
      };
      await this.cartRepository.addCartItem(cartItem);
    }
    
    // **Recalculate totals after adding item**
    cart = await this.getCartByUserId(userId);
    cart = await this.recalculateCartTotals(cart);
    
    return cart;
  }

  async updateCartItemQuantity(userId, cartItemId, quantity) {
    const cartItem = await this.cartRepository.findCartItemById(cartItemId);
    
    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Check stock availability for new quantity
    const stockAvailable = await this.productRepository.checkStock(cartItem.productId, quantity);
    if (!stockAvailable) {
      throw new Error('Insufficient stock for requested quantity');
    }

    cartItem.quantity = quantity;
    await this.cartRepository.updateCartItem(cartItemId, cartItem);
    
    // **Recalculate totals after quantity update**
    let cart = await this.getCartByUserId(userId);
    cart = await this.recalculateCartTotals(cart);
    
    return cart;
  }

  async removeItemFromCart(userId, cartItemId) {
    await this.cartRepository.removeCartItem(cartItemId);
    
    // **Recalculate totals after item removal**
    let cart = await this.getCartByUserId(userId);
    cart = await this.recalculateCartTotals(cart);
    
    return cart;
  }

  async clearCart(userId) {
    const cart = await this.getCartByUserId(userId);
    await this.cartRepository.deleteCart(cart.id);
    
    return { userId, items: [], subtotal: 0, tax: 0, total: 0 };
  }

  /**
   * **ADDED: Automatic recalculation of subtotal and total upon any quantity mutation**
   * This method is called after every cart modification to ensure totals are always accurate
   */
  async recalculateCartTotals(cart) {
    let subtotal = 0;
    
    // Calculate subtotal from all cart items
    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      item.unitPrice = product.price;
      item.totalPrice = item.quantity * item.unitPrice;
      subtotal += item.totalPrice;
    }
    
    // Calculate tax (assuming 10% tax rate)
    const tax = subtotal * 0.10;
    
    // Calculate shipping (free shipping over $50, otherwise $5.99)
    const shipping = subtotal >= 50 ? 0 : 5.99;
    
    // Calculate total
    const total = subtotal + tax + shipping;
    
    // Update cart with recalculated values
    cart.subtotal = parseFloat(subtotal.toFixed(2));
    cart.tax = parseFloat(tax.toFixed(2));
    cart.shipping = parseFloat(shipping.toFixed(2));
    cart.total = parseFloat(total.toFixed(2));
    
    // Persist updated totals
    await this.cartRepository.updateCart(cart.id, {
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total
    });
    
    return cart;
  }

  async getProduct(productId) {
    return await this.productRepository.findById(productId);
  }

  async getCartItem(cartItemId) {
    return await this.cartRepository.findCartItemById(cartItemId);
  }
}
```

#### 3.3.4 Sequence Diagram - Add Item to Cart with Validation

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant ProductRepo
    participant CartRepo
    participant Database

    Client->>Controller: POST /cart/items {productId, quantity}
    Controller->>Service: getProduct(productId)
    Service->>ProductRepo: findById(productId)
    ProductRepo->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepo: product data
    ProductRepo-->>Service: product
    Service-->>Controller: product
    
    alt quantity > max_order_quantity
        Controller-->>Client: 400 Error: Quantity exceeds limit
    else quantity valid
        Controller->>Service: addItemToCart(userId, productId, quantity)
        Service->>ProductRepo: checkStock(productId, quantity)
        ProductRepo->>Database: SELECT quantity FROM inventory WHERE product_id = ?
        Database-->>ProductRepo: stock quantity
        ProductRepo-->>Service: stockAvailable
        
        alt stock insufficient
            Service-->>Controller: Error: Insufficient stock
            Controller-->>Client: 400 Error: Insufficient stock
        else stock available
            Service->>CartRepo: findByUserId(userId)
            CartRepo->>Database: SELECT * FROM carts WHERE user_id = ?
            Database-->>CartRepo: cart data
            CartRepo-->>Service: cart
            
            Service->>CartRepo: addCartItem(cartItem)
            CartRepo->>Database: INSERT INTO cart_items
            Database-->>CartRepo: success
            CartRepo-->>Service: cartItem
            
            Service->>Service: recalculateCartTotals(cart)
            Service->>CartRepo: updateCart(cartId, totals)
            CartRepo->>Database: UPDATE carts SET subtotal, tax, total
            Database-->>CartRepo: success
            CartRepo-->>Service: updated cart
            
            Service-->>Controller: cart with recalculated totals
            Controller-->>Client: 200 OK: cart data
        end
    end
```

#### 3.3.5 Shopping Cart Component (Frontend)

```typescript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CartItem from './CartItem';
import { cartService } from '../services/cartService';

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  maxOrderQuantity: number;
  stockQuantity: number;
}

interface Cart {
  id: string;
  userId: string;
  items: CartItemData[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const ShoppingCart: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      setError('Failed to load cart');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    try {
      const updatedCart = await cartService.updateItemQuantity(cartItemId, newQuantity);
      setCart(updatedCart);
    } catch (err: any) {
      if (err.response?.data?.error === 'QUANTITY_EXCEEDS_LIMIT') {
        alert(`Cannot update quantity: ${err.response.data.message}`);
      } else {
        alert('Failed to update quantity');
      }
      console.error(err);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      const updatedCart = await cartService.removeItem(cartItemId);
      setCart(updatedCart);
    } catch (err) {
      alert('Failed to remove item');
      console.error(err);
    }
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  /**
   * **ADDED: Empty Cart View with Redirection Link**
   * Displays a user-friendly message with a link to continue shopping
   */
  const renderEmptyCart = () => {
    return (
      <div className="empty-cart-container">
        <div className="empty-cart-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        
        {/* **Explicit UI redirection link to continue shopping** */}
        <Link to="/products" className="continue-shopping-btn">
          Continue Shopping
        </Link>
        
        <div className="popular-categories">
          <h3>Popular Categories</h3>
          <div className="category-links">
            <Link to="/products?category=electronics">Electronics</Link>
            <Link to="/products?category=clothing">Clothing</Link>
            <Link to="/products?category=home">Home & Garden</Link>
            <Link to="/products?category=sports">Sports</Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return renderEmptyCart();
  }

  return (
    <div className="shopping-cart">
      <h1>Shopping Cart</h1>
      
      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>Tax:</span>
            <span>${cart.tax.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>Shipping:</span>
            <span>{cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}</span>
          </div>
          
          {cart.subtotal < 50 && cart.subtotal > 0 && (
            <div className="shipping-notice">
              Add ${(50 - cart.subtotal).toFixed(2)} more for free shipping!
            </div>
          )}
          
          <div className="summary-row total">
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.items.length === 0}
          >
            Proceed to Checkout
          </button>
          
          <Link to="/products" className="continue-shopping-link">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
```

#### 3.3.6 Cart Item Component (Frontend)

```typescript
import React, { useState } from 'react';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    maxOrderQuantity: number;
    stockQuantity: number;
  };
  onQuantityChange: (cartItemId: string, newQuantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * **ADDED: UI validation to prevent quantity exceeding max_order_quantity**
   * Validates quantity against business rules before allowing update
   */
  const validateQuantity = (newQuantity: number): boolean => {
    setValidationError(null);

    if (newQuantity < 1) {
      setValidationError('Quantity must be at least 1');
      return false;
    }

    if (newQuantity > item.maxOrderQuantity) {
      setValidationError(
        `Maximum order quantity for this product is ${item.maxOrderQuantity} units`
      );
      // **Display alert to user**
      alert(
        `Cannot add more than ${item.maxOrderQuantity} units of this product.\n` +
        `Maximum order quantity limit reached.`
      );
      return false;
    }

    if (newQuantity > item.stockQuantity) {
      setValidationError(
        `Only ${item.stockQuantity} units available in stock`
      );
      alert(
        `Cannot add more than ${item.stockQuantity} units.\n` +
        `Insufficient stock available.`
      );
      return false;
    }

    return true;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    
    if (isNaN(newQuantity)) {
      return;
    }

    setQuantity(newQuantity);
  };

  const handleQuantityBlur = () => {
    if (validateQuantity(quantity)) {
      if (quantity !== item.quantity) {
        onQuantityChange(item.id, quantity);
      }
    } else {
      // Reset to previous valid quantity
      setQuantity(item.quantity);
    }
  };

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    
    if (validateQuantity(newQuantity)) {
      setQuantity(newQuantity);
      onQuantityChange(item.id, newQuantity);
    }
  };

  const handleDecrement = () => {
    const newQuantity = quantity - 1;
    
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
      onQuantityChange(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${item.productName} from cart?`)) {
      onRemove(item.id);
    }
  };

  return (
    <div className="cart-item">
      <div className="item-image">
        <img src={item.productImage} alt={item.productName} />
      </div>
      
      <div className="item-details">
        <h3>{item.productName}</h3>
        <p className="item-price">${item.unitPrice.toFixed(2)} each</p>
        
        {/* **Display quantity limits and stock information** */}
        <div className="item-info">
          <span className="stock-info">
            {item.stockQuantity > 10 ? (
              <span className="in-stock">In Stock</span>
            ) : (
              <span className="low-stock">Only {item.stockQuantity} left</span>
            )}
          </span>
          <span className="max-quantity-info">
            Max order: {item.maxOrderQuantity} units
          </span>
        </div>
      </div>
      
      <div className="item-quantity">
        <label>Quantity:</label>
        <div className="quantity-controls">
          <button 
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="quantity-btn"
          >
            -
          </button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            min="1"
            max={item.maxOrderQuantity}
            className="quantity-input"
          />
          
          <button 
            onClick={handleIncrement}
            disabled={quantity >= item.maxOrderQuantity || quantity >= item.stockQuantity}
            className="quantity-btn"
          >
            +
          </button>
        </div>
        
        {/* **Display validation error inline** */}
        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}
      </div>
      
      <div className="item-total">
        <p className="total-price">${item.totalPrice.toFixed(2)}</p>
      </div>
      
      <div className="item-actions">
        <button onClick={handleRemove} className="remove-btn">
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
```

### 3.4 Order Service

#### 3.4.1 Responsibilities
- Order creation and management
- Order status tracking
- Payment processing integration
- Order history

#### 3.4.2 State Machine - Order Status

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
                    ┌────▼────────┐
              ┌────>│  CONFIRMED  │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  PROCESSING │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  SHIPPED    │
              │     └────┬────────┘
              │          │
              │     ┌────▼────────┐
              │     │  DELIVERED  │
              │     └─────────────┘
              │
         ┌────┴────┐
         │CANCELLED│
         └─────────┘
```

#### 3.4.3 Class Structure

```javascript
class OrderController {
  constructor(orderService, paymentService) {
    this.orderService = orderService;
    this.paymentService = paymentService;
  }

  async createOrder(req, res) {
    // Order creation logic
  }

  async getOrder(req, res) {
    // Order retrieval logic
  }

  async updateOrderStatus(req, res) {
    // Order status update logic
  }
}

class OrderService {
  constructor(orderRepository, inventoryService, notificationService) {
    this.orderRepository = orderRepository;
    this.inventoryService = inventoryService;
    this.notificationService = notificationService;
  }

  async createOrder(orderData) {
    // Order creation with inventory check
  }

  async processOrder(orderId) {
    // Order processing logic
  }

  async cancelOrder(orderId) {
    // Order cancellation logic
  }
}
```

## 4. Data Models

### 4.1 User Model

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 4.2 Product Model

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    brand VARCHAR(100),
    image_url VARCHAR(500),
    max_order_quantity INTEGER DEFAULT 10,
    min_order_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    warehouse_location VARCHAR(100),
    last_restocked TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_product ON inventory(product_id);
```

### 4.3 Shopping Cart Model

```sql
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    shipping DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_shopping_carts_user ON shopping_carts(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- Trigger to update cart updated_at timestamp when items change
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_carts 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_timestamp();
```

### 4.4 Order Model

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id UUID REFERENCES addresses(id),
    billing_address_id UUID REFERENCES addresses(id),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### 4.5 Address Model

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    address_type VARCHAR(50),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

## 5. API Specifications

### 5.1 User APIs

#### 5.1.1 Register User

**Endpoint**: `POST /api/v1/users/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "User registered successfully"
}
```

#### 5.1.2 Login

**Endpoint**: `POST /api/v1/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### 5.2 Product APIs

#### 5.2.1 Get Products

**Endpoint**: `GET /api/v1/products`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `search` (optional): Search term
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "sku": "PROD-001",
        "category": "Electronics",
        "imageUrl": "https://cdn.example.com/image.jpg",
        "inStock": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

#### 5.2.2 Get Product Details

**Endpoint**: `GET /api/v1/products/:productId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "sku": "PROD-001",
    "category": {
      "id": "cat-001",
      "name": "Electronics"
    },
    "brand": "Brand Name",
    "images": [
      "https://cdn.example.com/image1.jpg",
      "https://cdn.example.com/image2.jpg"
    ],
    "specifications": {
      "weight": "500g",
      "dimensions": "10x10x5 cm"
    },
    "inventory": {
      "inStock": true,
      "quantity": 50
    }
  }
}
```

### 5.3 Shopping Cart APIs

#### 5.3.1 Get Cart

**Endpoint**: `GET /api/v1/cart`

**Headers**:
- `Authorization`: Bearer {token}

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-123",
    "userId": "user-456",
    "items": [
      {
        "id": "item-789",
        "productId": "prod-001",
        "productName": "Product Name",
        "productImage": "https://cdn.example.com/image.jpg",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98,
        "maxOrderQuantity": 10,
        "stockQuantity": 50
      }
    ],
    "subtotal": 199.98,
    "tax": 19.99,
    "shipping": 0.00,
    "total": 219.97
  }
}
```

#### 5.3.2 Add Item to Cart

**Endpoint**: `POST /api/v1/cart/items`

**Headers**:
- `Authorization`: Bearer {token}

**Request Body**:
```json
{
  "productId": "prod-001",
  "quantity": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-123",
    "items": [...],
    "subtotal": 199.98,
    "tax": 19.99,
    "shipping": 0.00,
    "total": 219.97
  }
}
```

**Error Response** (400 Bad Request) - Quantity Exceeds Limit:
```json
{
  "success": false,
  "error": "QUANTITY_EXCEEDS_LIMIT",
  "message": "Quantity cannot exceed 10 units",
  "maxAllowed": 10
}
```

#### 5.3.3 Update Cart Item Quantity

**Endpoint**: `PUT /api/v1/cart/items/:cartItemId`

**Headers**:
- `Authorization`: Bearer {token}

**Request Body**:
```json
{
  "quantity": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-123",
    "items": [...],
    "subtotal": 499.95,
    "tax": 49.99,
    "shipping": 0.00,
    "total": 549.94
  }
}
```

**Error Response** (400 Bad Request) - Quantity Exceeds Maximum:
```json
{
  "success": false,
  "error": "QUANTITY_EXCEEDS_LIMIT",
  "message": "Quantity cannot exceed 10 units for this product",
  "maxAllowed": 10,
  "currentQuantity": 2
}
```

**Error Response** (400 Bad Request) - Quantity Below Minimum:
```json
{
  "success": false,
  "error": "QUANTITY_BELOW_MINIMUM",
  "message": "Quantity must be at least 1 units",
  "minRequired": 1
}
```

#### 5.3.4 Remove Item from Cart

**Endpoint**: `DELETE /api/v1/cart/items/:cartItemId`

**Headers**:
- `Authorization`: Bearer {token}

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-123",
    "items": [],
    "subtotal": 0.00,
    "tax": 0.00,
    "shipping": 0.00,
    "total": 0.00
  }
}
```

### 5.4 Order APIs

#### 5.4.1 Create Order

**Endpoint**: `POST /api/v1/orders`

**Headers**:
- `Authorization`: Bearer {token}

**Request Body**:
```json
{
  "items": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174001",
      "quantity": 2
    }
  ],
  "shippingAddressId": "addr-001",
  "billingAddressId": "addr-001",
  "paymentMethod": "credit_card"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orderId": "123e4567-e89b-12d3-a456-426614174002",
    "orderNumber": "ORD-2024-001",
    "status": "PENDING",
    "totalAmount": 199.98,
    "items": [
      {
        "productId": "123e4567-e89b-12d3-a456-426614174001",
        "productName": "Product Name",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 5.4.2 Get Order Details

**Endpoint**: `GET /api/v1/orders/:orderId`

**Headers**:
- `Authorization`: Bearer {token}

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": "123e4567-e89b-12d3-a456-426614174002",
    "orderNumber": "ORD-2024-001",
    "status": "PROCESSING",
    "totalAmount": 199.98,
    "items": [
      {
        "productId": "123e4567-e89b-12d3-a456-426614174001",
        "productName": "Product Name",
        "quantity": 2,
        "unitPrice": 99.99,
        "totalPrice": 199.98
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "paymentStatus": "PAID",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

## 6. Security Design

### 6.1 Authentication

#### 6.1.1 JWT Token Structure

```javascript
// Token Payload
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1642248000,
  "exp": 1642334400
}

// Token Generation
class JWTService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
```

#### 6.1.2 Password Hashing

```javascript
class PasswordService {
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
}
```

### 6.2 Authorization

#### 6.2.1 Role-Based Access Control (RBAC)

```javascript
class AuthorizationMiddleware {
  checkRole(allowedRoles) {
    return (req, res, next) => {
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    };
  }

  checkOwnership(resourceType) {
    return async (req, res, next) => {
      const userId = req.user.userId;
      const resourceId = req.params.id;
      
      const resource = await this.getResource(resourceType, resourceId);
      
      if (resource.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    };
  }
}

// Usage
router.get(
  '/orders/:id',
  authenticate,
  authorizationMiddleware.checkOwnership('order'),
  orderController.getOrder
);

router.post(
  '/products',
  authenticate,
  authorizationMiddleware.checkRole(['admin', 'seller']),
  productController.createProduct
);
```

### 6.3 Data Encryption

#### 6.3.1 Sensitive Data Encryption

```javascript
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted, iv, authTag) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 6.4 API Security

#### 6.4.1 Rate Limiting

```javascript
class RateLimiter {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async checkLimit(identifier, maxRequests, windowSeconds) {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    if (current > maxRequests) {
      const ttl = await this.redis.ttl(key);
      throw new RateLimitError(`Rate limit exceeded. Try again in ${ttl} seconds`);
    }
    
    return {
      remaining: maxRequests - current,
      reset: Date.now() + (windowSeconds * 1000)
    };
  }
}

// Middleware
const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.userId || req.ip;
    const limit = await rateLimiter.checkLimit(identifier, 100, 60);
    
    res.set({
      'X-RateLimit-Remaining': limit.remaining,
      'X-RateLimit-Reset': limit.reset
    });
    
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
```

#### 6.4.2 Input Validation

```javascript
class ValidationService {
  validateUserRegistration(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    });
    
    return schema.validate(data);
  }

  validateProductCreation(data) {
    const schema = Joi.object({
      name: Joi.string().min(3).max(255).required(),
      description: Joi.string().max(2000).optional(),
      price: Joi.number().positive().precision(2).required(),
      sku: Joi.string().alphanum().required(),
      categoryId: Joi.string().uuid().required(),
      brand: Joi.string().max(100).optional()
    });
    
    return schema.validate(data);
  }

  sanitizeInput(input) {
    // Remove potentially dangerous characters
    return input.replace(/[<>"'&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    });
  }
}
```

## 7. Performance Considerations

### 7.1 Caching Strategy

#### 7.1.1 Redis Cache Implementation

```javascript
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in Product Service
class ProductService {
  async getProductById(productId) {
    const cacheKey = `product:${productId}`;
    
    // Try cache first
    let product = await this.cacheService.get(cacheKey);
    
    if (!product) {
      // Cache miss - fetch from database
      product = await this.productRepository.findById(productId);
      
      if (product) {
        // Store in cache
        await this.cacheService.set(cacheKey, product, 3600);
      }
    }
    
    return product;
  }

  async updateProduct(productId, updateData) {
    const product = await this.productRepository.update(productId, updateData);
    
    // Invalidate cache
    await this.cacheService.delete(`product:${productId}`);
    await this.cacheService.invalidatePattern('products:list:*');
    
    return product;
  }
}
```

#### 7.1.2 Cache Warming

```javascript
class CacheWarmer {
  constructor(cacheService, productService) {
    this.cacheService = cacheService;
    this.productService = productService;
  }

  async warmPopularProducts() {
    // Get top 100 popular products
    const popularProducts = await this.productService.getPopularProducts(100);
    
    for (const product of popularProducts) {
      const cacheKey = `product:${product.id}`;
      await this.cacheService.set(cacheKey, product, 7200); // 2 hours
    }
  }

  async warmCategories() {
    const categories = await this.categoryService.getAllCategories();
    await this.cacheService.set('categories:all', categories, 86400); // 24 hours
  }

  async scheduleWarming() {
    // Run every hour
    setInterval(async () => {
      await this.warmPopularProducts();
      await this.warmCategories();
    }, 3600000);
  }
}
```

### 7.2 Database Optimization

#### 7.2.1 Query Optimization

```javascript
class ProductRepository {
  async findProductsWithPagination(filters, page, limit) {
    const offset = (page - 1) * limit;
    
    // Optimized query with proper indexing
    const query = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.sku,
        c.name as category_name,
        i.quantity as stock_quantity
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = true
        AND ($1::uuid IS NULL OR p.category_id = $1)
        AND ($2::decimal IS NULL OR p.price >= $2)
        AND ($3::decimal IS NULL OR p.price <= $3)
        AND ($4::text IS NULL OR p.name ILIKE $4)
      ORDER BY p.created_at DESC
      LIMIT $5 OFFSET $6
    `;
    
    const searchPattern = filters.search ? `%${filters.search}%` : null;
    
    const result = await this.db.query(query, [
      filters.categoryId || null,
      filters.minPrice || null,
      filters.maxPrice || null,
      searchPattern,
      limit,
      offset
    ]);
    
    return result.rows;
  }

  async getProductWithDetails(productId) {
    // Single query with joins instead of multiple queries
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        i.quantity as stock_quantity,
        i.reserved_quantity,
        json_agg(
          json_build_object(
            'url', pi.image_url,
            'alt', pi.alt_text,
            'order', pi.display_order
          ) ORDER BY pi.display_order
        ) as images
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name, i.quantity, i.reserved_quantity
    `;
    
    const result = await this.db.query(query, [productId]);
    return result.rows[0];
  }
}
```

#### 7.2.2 Connection Pooling

```javascript
const { Pool } = require('pg');

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum number of clients
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn('Slow query detected', { text, duration });
    }
    
    return result;
  }

  async getClient() {
    return await this.pool.connect();
  }
}
```

### 7.3 Load Balancing

#### 7.3.1 Application Load Balancing

```javascript
// Nginx Configuration
const nginxConfig = `
upstream api_backend {
    least_conn;
    server api1.example.com:3000 weight=3;
    server api2.example.com:3000 weight=3;
    server api3.example.com:3000 weight=2;
    server api4.example.com:3000 backup;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        // Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        // Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
`;
```

### 7.4 Asynchronous Processing

#### 7.4.1 Message Queue Implementation

```javascript
class MessageQueueService {
  constructor(rabbitMQConnection) {
    this.connection = rabbitMQConnection;
    this.channel = null;
  }

  async initialize() {
    this.channel = await this.connection.createChannel();
    
    // Declare exchanges
    await this.channel.assertExchange('orders', 'topic', { durable: true });
    await this.channel.assertExchange('notifications', 'fanout', { durable: true });
    
    // Declare queues
    await this.channel.assertQueue('order.processing', { durable: true });
    await this.channel.assertQueue('email.notifications', { durable: true });
    await this.channel.assertQueue('inventory.updates', { durable: true });
  }

  async publishOrderEvent(orderData, routingKey) {
    const message = JSON.stringify(orderData);
    
    this.channel.publish(
      'orders',
      routingKey,
      Buffer.from(message),
      { persistent: true }
    );
  }

  async consumeOrderEvents(callback) {
    await this.channel.bindQueue('order.processing', 'orders', 'order.*');
    
    this.channel.consume('order.processing', async (msg) => {
      if (msg) {
        try {
          const orderData = JSON.parse(msg.content.toString());
          await callback(orderData);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing order event:', error);
          // Requeue or send to dead letter queue
          this.channel.nack(msg, false, false);
        }
      }
    });
  }
}

// Usage
class OrderProcessor {
  constructor(messageQueue, orderService) {
    this.messageQueue = messageQueue;
    this.orderService = orderService;
  }

  async start() {
    await this.messageQueue.consumeOrderEvents(async (orderData) => {
      await this.processOrder(orderData);
    });
  }

  async processOrder(orderData) {
    // Process order asynchronously
    await this.orderService.processPayment(orderData.orderId);
    await this.orderService.updateInventory(orderData.items);
    await this.orderService.sendConfirmationEmail(orderData.userId);
  }
}
```

## 8. Deployment Architecture

### 8.1 Kubernetes Deployment

#### 8.1.1 Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ecommerce/api-gateway:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: ecommerce
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### 8.1.2 Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 8.2 Monitoring and Logging

#### 8.2.1 Prometheus Metrics

```javascript
const prometheus = require('prom-client');

class MetricsService {
  constructor() {
    // Create a Registry
    this.register = new prometheus.Registry();
    
    // Add default metrics
    prometheus.collectDefaultMetrics({ register: this.register });
    
    // Custom metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });
    
    this.httpRequestTotal = new prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });
    
    this.activeConnections = new prometheus.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });
    
    this.orderProcessingDuration = new prometheus.Histogram({
      name: 'order_processing_duration_seconds',
      help: 'Duration of order processing',
      buckets: [1, 5, 10, 30, 60]
    });
    
    // Register metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.activeConnections);
    this.register.registerMetric(this.orderProcessingDuration);
  }

  getMetrics() {
    return this.register.metrics();
  }
}

// Middleware
const metricsMiddleware = (metricsService) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      metricsService.httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .observe(duration);
      
      metricsService.httpRequestTotal
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .inc();
    });
    
    next();
  };
};
```

#### 8.2.2 Structured Logging

```javascript
const winston = require('winston');

class LoggerService {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'ecommerce-api',
        environment: process.env.NODE_ENV
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, error, meta = {}) {
    this.logger.error(message, {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

// Usage
const logger = new LoggerService();

class OrderService {
  async createOrder(orderData) {
    logger.info('Creating new order', {
      userId: orderData.userId,
      itemCount: orderData.items.length
    });
    
    try {
      const order = await this.orderRepository.create(orderData);
      
      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber
      });
      
      return order;
    } catch (error) {
      logger.error('Failed to create order', error, {
        userId: orderData.userId
      });
      throw error;
    }
  }
}
```

### 8.3 CI/CD Pipeline

#### 8.3.1 GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/api-gateway \
          api-gateway=ghcr.io/${{ github.repository }}:${{ github.sha }} \
          -n ecommerce
        kubectl rollout status deployment/api-gateway -n ecommerce
```

## Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the E-Commerce Platform with complete Shopping Cart functionality. It covers all critical aspects including:

- Detailed component architecture and interactions
- Complete data models and database schemas
- API specifications with request/response formats
- **Shopping Cart Service with automatic recalculation of totals**
- **Shopping Cart Controller with max_order_quantity validation**
- **Shopping Cart Component with empty cart redirection link**
- **Cart Item Component with quantity validation and alerts**
- Security implementation with authentication and authorization
- Performance optimization strategies
- Deployment and monitoring configurations

The design follows industry best practices and is scalable, maintainable, and secure.

**Status**: Complete and Ready for Review with Shopping Cart Enhancements