# Low Level Design Document
# E-commerce Product Management System

## Document Information
- **Version**: 2.0
- **Last Updated**: 2024
- **Status**: Updated with Shopping Cart Management

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Business Logic](#business-logic)
7. [Security Design](#security-design)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Architecture](#deployment-architecture)

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-commerce Product Management System. It describes the internal structure, components, interfaces, and data flows required to implement the system.

### 1.2 Scope
This document covers:
- Product catalog management
- Shopping cart management
- Inventory tracking
- Product search and filtering
- User authentication and authorization
- Session management
- RESTful API design
- Database schema design
- Frontend component architecture

### 1.3 Technology Stack
- **Backend**: Node.js with Express.js
- **Frontend**: React.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Session Management**: Redis-based session store
- **API Documentation**: OpenAPI 3.0

## 2. System Architecture

### 2.1 High-Level Architecture

```mermaid
graph TB
    Client[Web Browser]
    LB[Load Balancer]
    API1[API Server 1]
    API2[API Server 2]
    Cache[Redis Cache]
    DB[(PostgreSQL DB)]
    Session[Redis Session Store]
    
    Client -->|HTTPS| LB
    LB --> API1
    LB --> API2
    API1 --> Cache
    API2 --> Cache
    API1 --> DB
    API2 --> DB
    API1 --> Session
    API2 --> Session
```

### 2.2 Component Architecture

```mermaid
graph LR
    subgraph Frontend
        UI[UI Components]
        State[State Management]
        API_Client[API Client]
    end
    
    subgraph Backend
        Router[Express Router]
        Controller[Controllers]
        Service[Business Logic]
        Repository[Data Access Layer]
        Auth[Authentication Middleware]
        SessionMgr[Session Manager]
    end
    
    subgraph Data
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        SessionStore[(Redis Session)]
    end
    
    UI --> State
    State --> API_Client
    API_Client -->|HTTP/REST| Router
    Router --> Auth
    Auth --> SessionMgr
    SessionMgr --> SessionStore
    Router --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> DB
    Repository --> Cache
```

## 3. Component Design

### 3.1 Backend Components

#### 3.1.1 Express Router Configuration

```javascript
// routes/index.js
const express = require('express');
const router = express.Router();
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const authRoutes = require('./authRoutes');
const authMiddleware = require('../middleware/auth');
const sessionMiddleware = require('../middleware/session');

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/products', authMiddleware, sessionMiddleware, productRoutes);
router.use('/cart', authMiddleware, sessionMiddleware, cartRoutes);

module.exports = router;
```

#### 3.1.2 Product Controller

```javascript
// controllers/productController.js
const productService = require('../services/productService');
const { validationResult } = require('express-validator');

class ProductController {
    async getAllProducts(req, res, next) {
        try {
            const { page = 1, limit = 20, category, minPrice, maxPrice, inStock } = req.query;
            
            const filters = {
                category,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                inStock: inStock === 'true'
            };
            
            const result = await productService.getProducts(page, limit, filters);
            
            res.json({
                success: true,
                data: result.products,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async createProduct(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const productData = req.body;
            const product = await productService.createProduct(productData);
            
            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const product = await productService.updateProduct(id, updates);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
    
    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await productService.deleteProduct(id);
            
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
    
    async checkStock(req, res, next) {
        try {
            const { id } = req.params;
            const { quantity } = req.query;
            
            const available = await productService.checkStockAvailability(id, parseInt(quantity));
            
            res.json({
                success: true,
                data: {
                    available,
                    productId: id,
                    requestedQuantity: parseInt(quantity)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
```

#### 3.1.3 Shopping Cart Controller

```javascript
// controllers/cartController.js
const cartService = require('../services/cartService');
const { validationResult } = require('express-validator');

class CartController {
    async getCart(req, res, next) {
        try {
            const userId = req.user.id;
            const cart = await cartService.getCartByUserId(userId);
            
            res.json({
                success: true,
                data: cart
            });
        } catch (error) {
            next(error);
        }
    }
    
    async addToCart(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const userId = req.user.id;
            const { productId, quantity } = req.body;
            
            const cart = await cartService.addItemToCart(userId, productId, quantity);
            
            res.json({
                success: true,
                data: cart,
                message: 'Item added to cart successfully'
            });
        } catch (error) {
            next(error);
        }
    }
    
    async updateCartItem(req, res, next) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;
            const { quantity } = req.body;
            
            const cart = await cartService.updateCartItemQuantity(userId, itemId, quantity);
            
            res.json({
                success: true,
                data: cart,
                message: 'Cart item updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }
    
    async removeFromCart(req, res, next) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;
            
            const cart = await cartService.removeItemFromCart(userId, itemId);
            
            res.json({
                success: true,
                data: cart,
                message: 'Item removed from cart successfully'
            });
        } catch (error) {
            next(error);
        }
    }
    
    async clearCart(req, res, next) {
        try {
            const userId = req.user.id;
            await cartService.clearCart(userId);
            
            res.json({
                success: true,
                message: 'Cart cleared successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CartController();
```

#### 3.1.4 Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }
        
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;
```

#### 3.1.5 Session Management Middleware

```javascript
// middleware/session.js
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

class SessionManager {
    constructor() {
        this.sessionPrefix = 'session:';
        this.sessionTTL = 3600; // 1 hour in seconds
    }
    
    async createSession(userId, userData) {
        const sessionId = uuidv4();
        const sessionKey = `${this.sessionPrefix}${sessionId}`;
        
        const sessionData = {
            userId,
            ...userData,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        await redis.setex(sessionKey, this.sessionTTL, JSON.stringify(sessionData));
        return sessionId;
    }
    
    async getSession(sessionId) {
        const sessionKey = `${this.sessionPrefix}${sessionId}`;
        const sessionData = await redis.get(sessionKey);
        
        if (!sessionData) {
            return null;
        }
        
        return JSON.parse(sessionData);
    }
    
    async updateSession(sessionId, updates) {
        const session = await this.getSession(sessionId);
        
        if (!session) {
            throw new Error('Session not found');
        }
        
        const updatedSession = {
            ...session,
            ...updates,
            lastActivity: Date.now()
        };
        
        const sessionKey = `${this.sessionPrefix}${sessionId}`;
        await redis.setex(sessionKey, this.sessionTTL, JSON.stringify(updatedSession));
        
        return updatedSession;
    }
    
    async destroySession(sessionId) {
        const sessionKey = `${this.sessionPrefix}${sessionId}`;
        await redis.del(sessionKey);
    }
    
    async refreshSession(sessionId) {
        const session = await this.getSession(sessionId);
        
        if (!session) {
            throw new Error('Session not found');
        }
        
        const sessionKey = `${this.sessionPrefix}${sessionId}`;
        await redis.expire(sessionKey, this.sessionTTL);
    }
}

const sessionManager = new SessionManager();

const sessionMiddleware = async (req, res, next) => {
    try {
        const sessionId = req.headers['x-session-id'];
        
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: 'Session ID required'
            });
        }
        
        const session = await sessionManager.getSession(sessionId);
        
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }
        
        // Refresh session on activity
        await sessionManager.refreshSession(sessionId);
        
        req.session = session;
        req.sessionId = sessionId;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Session management error'
        });
    }
};

module.exports = { sessionMiddleware, sessionManager };
```

### 3.2 Service Layer

#### 3.2.1 Product Service

```javascript
// services/productService.js
const productRepository = require('../repositories/productRepository');
const cacheService = require('./cacheService');

class ProductService {
    async getProducts(page, limit, filters) {
        const offset = (page - 1) * limit;
        
        const cacheKey = `products:${page}:${limit}:${JSON.stringify(filters)}`;
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const { products, total } = await productRepository.findAll(offset, limit, filters);
        
        const result = {
            products,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        };
        
        await cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
        
        return result;
    }
    
    async getProductById(id) {
        const cacheKey = `product:${id}`;
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const product = await productRepository.findById(id);
        
        if (product) {
            await cacheService.set(cacheKey, product, 600); // Cache for 10 minutes
        }
        
        return product;
    }
    
    async createProduct(productData) {
        const product = await productRepository.create(productData);
        await cacheService.invalidatePattern('products:*');
        return product;
    }
    
    async updateProduct(id, updates) {
        const product = await productRepository.update(id, updates);
        
        if (product) {
            await cacheService.delete(`product:${id}`);
            await cacheService.invalidatePattern('products:*');
        }
        
        return product;
    }
    
    async deleteProduct(id) {
        await productRepository.delete(id);
        await cacheService.delete(`product:${id}`);
        await cacheService.invalidatePattern('products:*');
    }
    
    async checkStockAvailability(productId, quantity) {
        const product = await this.getProductById(productId);
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (quantity > product.max_order_quantity) {
            return false;
        }
        
        return product.stock_quantity >= quantity;
    }
    
    async updateStock(productId, quantityChange) {
        return await productRepository.updateStock(productId, quantityChange);
    }
}

module.exports = new ProductService();
```

#### 3.2.2 Shopping Cart Service

```javascript
// services/cartService.js
const cartRepository = require('../repositories/cartRepository');
const productService = require('./productService');
const cacheService = require('./cacheService');

class CartService {
    async getCartByUserId(userId) {
        const cacheKey = `cart:${userId}`;
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        let cart = await cartRepository.findByUserId(userId);
        
        if (!cart) {
            cart = await cartRepository.create(userId);
        }
        
        const cartWithDetails = await this.enrichCartWithProductDetails(cart);
        await cacheService.set(cacheKey, cartWithDetails, 300);
        
        return cartWithDetails;
    }
    
    async addItemToCart(userId, productId, quantity) {
        // Validate product exists and has sufficient stock
        const product = await productService.getProductById(productId);
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (quantity > product.max_order_quantity) {
            throw new Error(`Maximum order quantity is ${product.max_order_quantity}`);
        }
        
        const available = await productService.checkStockAvailability(productId, quantity);
        
        if (!available) {
            throw new Error('Insufficient stock');
        }
        
        let cart = await cartRepository.findByUserId(userId);
        
        if (!cart) {
            cart = await cartRepository.create(userId);
        }
        
        const existingItem = cart.items.find(item => item.product_id === productId);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > product.max_order_quantity) {
                throw new Error(`Maximum order quantity is ${product.max_order_quantity}`);
            }
            
            await cartRepository.updateItemQuantity(cart.id, existingItem.id, newQuantity);
        } else {
            await cartRepository.addItem(cart.id, productId, quantity, product.price);
        }
        
        await cacheService.delete(`cart:${userId}`);
        return await this.getCartByUserId(userId);
    }
    
    async updateCartItemQuantity(userId, itemId, quantity) {
        const cart = await cartRepository.findByUserId(userId);
        
        if (!cart) {
            throw new Error('Cart not found');
        }
        
        const item = cart.items.find(i => i.id === itemId);
        
        if (!item) {
            throw new Error('Cart item not found');
        }
        
        const product = await productService.getProductById(item.product_id);
        
        if (quantity > product.max_order_quantity) {
            throw new Error(`Maximum order quantity is ${product.max_order_quantity}`);
        }
        
        const available = await productService.checkStockAvailability(item.product_id, quantity);
        
        if (!available) {
            throw new Error('Insufficient stock');
        }
        
        await cartRepository.updateItemQuantity(cart.id, itemId, quantity);
        await cacheService.delete(`cart:${userId}`);
        
        return await this.getCartByUserId(userId);
    }
    
    async removeItemFromCart(userId, itemId) {
        const cart = await cartRepository.findByUserId(userId);
        
        if (!cart) {
            throw new Error('Cart not found');
        }
        
        await cartRepository.removeItem(cart.id, itemId);
        await cacheService.delete(`cart:${userId}`);
        
        return await this.getCartByUserId(userId);
    }
    
    async clearCart(userId) {
        const cart = await cartRepository.findByUserId(userId);
        
        if (cart) {
            await cartRepository.clearCart(cart.id);
            await cacheService.delete(`cart:${userId}`);
        }
    }
    
    async enrichCartWithProductDetails(cart) {
        const itemsWithDetails = await Promise.all(
            cart.items.map(async (item) => {
                const product = await productService.getProductById(item.product_id);
                return {
                    ...item,
                    product: {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        image_url: product.image_url,
                        stock_quantity: product.stock_quantity,
                        max_order_quantity: product.max_order_quantity
                    },
                    subtotal: item.quantity * item.price
                };
            })
        );
        
        const total = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);
        
        return {
            ...cart,
            items: itemsWithDetails,
            total
        };
    }
}

module.exports = new CartService();
```

### 3.3 Repository Layer

#### 3.3.1 Product Repository

```javascript
// repositories/productRepository.js
const db = require('../config/database');

class ProductRepository {
    async findAll(offset, limit, filters) {
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (filters.category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(filters.category);
        }
        
        if (filters.minPrice !== undefined) {
            query += ` AND price >= $${paramIndex++}`;
            params.push(filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
            query += ` AND price <= $${paramIndex++}`;
            params.push(filters.maxPrice);
        }
        
        if (filters.inStock) {
            query += ` AND stock_quantity > 0`;
        }
        
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        return {
            products: result.rows,
            total
        };
    }
    
    async findById(id) {
        const query = 'SELECT * FROM products WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
    
    async create(productData) {
        const query = `
            INSERT INTO products (
                name, description, price, category, 
                stock_quantity, max_order_quantity, image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [
            productData.name,
            productData.description,
            productData.price,
            productData.category,
            productData.stock_quantity || 0,
            productData.max_order_quantity || 10,
            productData.image_url
        ];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        
        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${paramIndex++}`);
            values.push(updates[key]);
        });
        
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE products 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await db.query(query, values);
        return result.rows[0];
    }
    
    async delete(id) {
        const query = 'DELETE FROM products WHERE id = $1';
        await db.query(query, [id]);
    }
    
    async updateStock(productId, quantityChange) {
        const query = `
            UPDATE products 
            SET stock_quantity = stock_quantity + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [quantityChange, productId]);
        return result.rows[0];
    }
}

module.exports = new ProductRepository();
```

#### 3.3.2 Shopping Cart Repository

```javascript
// repositories/cartRepository.js
const db = require('../config/database');

class CartRepository {
    async findByUserId(userId) {
        const cartQuery = 'SELECT * FROM shopping_carts WHERE user_id = $1';
        const cartResult = await db.query(cartQuery, [userId]);
        
        if (cartResult.rows.length === 0) {
            return null;
        }
        
        const cart = cartResult.rows[0];
        
        const itemsQuery = `
            SELECT * FROM cart_items 
            WHERE cart_id = $1 
            ORDER BY created_at DESC
        `;
        const itemsResult = await db.query(itemsQuery, [cart.id]);
        
        return {
            ...cart,
            items: itemsResult.rows
        };
    }
    
    async create(userId) {
        const query = `
            INSERT INTO shopping_carts (user_id)
            VALUES ($1)
            RETURNING *
        `;
        
        const result = await db.query(query, [userId]);
        return {
            ...result.rows[0],
            items: []
        };
    }
    
    async addItem(cartId, productId, quantity, price) {
        const query = `
            INSERT INTO cart_items (cart_id, product_id, quantity, price)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const result = await db.query(query, [cartId, productId, quantity, price]);
        return result.rows[0];
    }
    
    async updateItemQuantity(cartId, itemId, quantity) {
        const query = `
            UPDATE cart_items 
            SET quantity = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND cart_id = $3
            RETURNING *
        `;
        
        const result = await db.query(query, [quantity, itemId, cartId]);
        return result.rows[0];
    }
    
    async removeItem(cartId, itemId) {
        const query = 'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2';
        await db.query(query, [itemId, cartId]);
    }
    
    async clearCart(cartId) {
        const query = 'DELETE FROM cart_items WHERE cart_id = $1';
        await db.query(query, [cartId]);
    }
}

module.exports = new CartRepository();
```

### 3.4 Frontend Components

#### 3.4.1 Product List Component

```javascript
// components/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';
import Pagination from './Pagination';
import FilterPanel from './FilterPanel';

const ProductList = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({});
    const { products, loading, error, pagination } = useProducts(page, filters);
    
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
    };
    
    if (loading) return <div className="loading">Loading products...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;
    
    return (
        <div className="product-list-container">
            <FilterPanel onFilterChange={handleFilterChange} />
            
            <div className="product-grid">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            
            <Pagination 
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default ProductList;
```

#### 3.4.2 Shopping Cart Component

```javascript
// components/ShoppingCart.jsx
import React from 'react';
import { useCart } from '../hooks/useCart';
import CartItem from './CartItem';
import './ShoppingCart.css';

const ShoppingCart = () => {
    const { cart, loading, error, updateQuantity, removeItem, clearCart } = useCart();
    
    if (loading) return <div className="loading">Loading cart...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Add some products to get started!</p>
            </div>
        );
    }
    
    return (
        <div className="shopping-cart">
            <div className="cart-header">
                <h2>Shopping Cart</h2>
                <button onClick={clearCart} className="clear-cart-btn">
                    Clear Cart
                </button>
            </div>
            
            <div className="cart-items">
                {cart.items.map(item => (
                    <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                    />
                ))}
            </div>
            
            <div className="cart-summary">
                <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                    <span>Total:</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>
                <button className="checkout-btn">Proceed to Checkout</button>
            </div>
        </div>
    );
};

export default ShoppingCart;
```

#### 3.4.3 Cart Item Component

```javascript
// components/CartItem.jsx
import React, { useState } from 'react';
import './CartItem.css';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
    const [quantity, setQuantity] = useState(item.quantity);
    const [updating, setUpdating] = useState(false);
    
    const handleQuantityChange = async (newQuantity) => {
        if (newQuantity < 1) return;
        if (newQuantity > item.product.max_order_quantity) {
            alert(`Maximum order quantity is ${item.product.max_order_quantity}`);
            return;
        }
        
        setUpdating(true);
        try {
            await onUpdateQuantity(item.id, newQuantity);
            setQuantity(newQuantity);
        } catch (error) {
            alert(error.message);
        } finally {
            setUpdating(false);
        }
    };
    
    const handleRemove = async () => {
        if (window.confirm('Remove this item from cart?')) {
            await onRemove(item.id);
        }
    };
    
    return (
        <div className="cart-item">
            <img src={item.product.image_url} alt={item.product.name} />
            
            <div className="item-details">
                <h3>{item.product.name}</h3>
                <p>{item.product.description}</p>
                <p className="stock-info">
                    {item.product.stock_quantity > 0 
                        ? `In Stock (${item.product.stock_quantity} available)`
                        : 'Out of Stock'
                    }
                </p>
            </div>
            
            <div className="item-quantity">
                <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={updating || quantity <= 1}
                >
                    -
                </button>
                <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    disabled={updating}
                    min="1"
                    max={item.product.max_order_quantity}
                />
                <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={updating || quantity >= item.product.max_order_quantity}
                >
                    +
                </button>
            </div>
            
            <div className="item-price">
                <p className="unit-price">${item.price.toFixed(2)}</p>
                <p className="subtotal">${item.subtotal.toFixed(2)}</p>
            </div>
            
            <button 
                className="remove-btn"
                onClick={handleRemove}
                disabled={updating}
            >
                Remove
            </button>
        </div>
    );
};

export default CartItem;
```

#### 3.4.4 Custom Hooks

```javascript
// hooks/useCart.js
import { useState, useEffect } from 'react';
import { cartAPI } from '../services/api';

export const useCart = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchCart = async () => {
        try {
            setLoading(true);
            const data = await cartAPI.getCart();
            setCart(data);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCart();
    }, []);
    
    const addToCart = async (productId, quantity) => {
        try {
            const data = await cartAPI.addToCart(productId, quantity);
            setCart(data);
            return data;
        } catch (err) {
            throw err;
        }
    };
    
    const updateQuantity = async (itemId, quantity) => {
        try {
            const data = await cartAPI.updateCartItem(itemId, quantity);
            setCart(data);
            return data;
        } catch (err) {
            throw err;
        }
    };
    
    const removeItem = async (itemId) => {
        try {
            const data = await cartAPI.removeFromCart(itemId);
            setCart(data);
            return data;
        } catch (err) {
            throw err;
        }
    };
    
    const clearCart = async () => {
        try {
            await cartAPI.clearCart();
            await fetchCart();
        } catch (err) {
            throw err;
        }
    };
    
    return {
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refresh: fetchCart
    };
};
```

## 4. Data Models

### 4.1 Database Schema

```sql
-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    max_order_quantity INTEGER NOT NULL DEFAULT 10 CHECK (max_order_quantity > 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- Shopping Carts Table
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_carts_user ON shopping_carts(user_id);

-- Cart Items Table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- Users Table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 4.2 Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ SHOPPING_CARTS : has
    SHOPPING_CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_in
    
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        string name
        text description
        decimal price
        string category
        integer stock_quantity
        integer max_order_quantity
        string image_url
        timestamp created_at
        timestamp updated_at
    }
    
    SHOPPING_CARTS {
        uuid id PK
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        integer quantity
        decimal price
        timestamp created_at
        timestamp updated_at
    }
```

### 4.3 TypeScript Interfaces

```typescript
// types/product.ts
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stock_quantity: number;
    max_order_quantity: number;
    image_url: string;
    created_at: Date;
    updated_at: Date;
}

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
}

export interface ProductListResponse {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
```

```typescript
// types/cart.ts
export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price: number;
    product: {
        id: string;
        name: string;
        description: string;
        image_url: string;
        stock_quantity: number;
        max_order_quantity: number;
    };
    subtotal: number;
    created_at: Date;
    updated_at: Date;
}

export interface ShoppingCart {
    id: string;
    user_id: string;
    items: CartItem[];
    total: number;
    created_at: Date;
    updated_at: Date;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}
```

## 5. API Specifications

### 5.1 Product Endpoints

#### GET /api/products
Retrieve a paginated list of products with optional filters.

**Request:**
```http
GET /api/products?page=1&limit=20&category=electronics&minPrice=100&maxPrice=1000&inStock=true
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Laptop",
            "description": "High-performance laptop",
            "price": 999.99,
            "category": "electronics",
            "stock_quantity": 50,
            "max_order_quantity": 5,
            "image_url": "https://example.com/laptop.jpg",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "totalPages": 5
    }
}
```

#### GET /api/products/:id
Retrieve a single product by ID.

**Request:**
```http
GET /api/products/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 999.99,
        "category": "electronics",
        "stock_quantity": 50,
        "max_order_quantity": 5,
        "image_url": "https://example.com/laptop.jpg",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
}
```

#### POST /api/products
Create a new product.

**Request:**
```http
POST /api/products
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json

{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "electronics",
    "stock_quantity": 50,
    "max_order_quantity": 5,
    "image_url": "https://example.com/laptop.jpg"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 999.99,
        "category": "electronics",
        "stock_quantity": 50,
        "max_order_quantity": 5,
        "image_url": "https://example.com/laptop.jpg",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
}
```

#### PUT /api/products/:id
Update an existing product.

**Request:**
```http
PUT /api/products/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json

{
    "price": 899.99,
    "stock_quantity": 45,
    "max_order_quantity": 3
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 899.99,
        "category": "electronics",
        "stock_quantity": 45,
        "max_order_quantity": 3,
        "image_url": "https://example.com/laptop.jpg",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-02T00:00:00Z"
    }
}
```

### 5.2 Shopping Cart Endpoints

#### GET /api/cart
Retrieve the current user's shopping cart.

**Request:**
```http
GET /api/cart
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "cart-uuid",
        "user_id": "user-uuid",
        "items": [
            {
                "id": "item-uuid",
                "cart_id": "cart-uuid",
                "product_id": "product-uuid",
                "quantity": 2,
                "price": 999.99,
                "product": {
                    "id": "product-uuid",
                    "name": "Laptop",
                    "description": "High-performance laptop",
                    "image_url": "https://example.com/laptop.jpg",
                    "stock_quantity": 50,
                    "max_order_quantity": 5
                },
                "subtotal": 1999.98,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        ],
        "total": 1999.98,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
}
```

#### POST /api/cart/items
Add an item to the shopping cart.

**Request:**
```http
POST /api/cart/items
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json

{
    "productId": "product-uuid",
    "quantity": 2
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "cart-uuid",
        "user_id": "user-uuid",
        "items": [...],
        "total": 1999.98
    },
    "message": "Item added to cart successfully"
}
```

#### PUT /api/cart/items/:itemId
Update the quantity of a cart item.

**Request:**
```http
PUT /api/cart/items/item-uuid
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
Content-Type: application/json

{
    "quantity": 3
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "cart-uuid",
        "user_id": "user-uuid",
        "items": [...],
        "total": 2999.97
    },
    "message": "Cart item updated successfully"
}
```

#### DELETE /api/cart/items/:itemId
Remove an item from the shopping cart.

**Request:**
```http
DELETE /api/cart/items/item-uuid
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "cart-uuid",
        "user_id": "user-uuid",
        "items": [],
        "total": 0
    },
    "message": "Item removed from cart successfully"
}
```

#### DELETE /api/cart
Clear all items from the shopping cart.

**Request:**
```http
DELETE /api/cart
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "message": "Cart cleared successfully"
}
```

### 5.3 Authentication Endpoints

#### POST /api/auth/login
Authenticate user and create session.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "token": "jwt-token",
        "sessionId": "session-uuid",
        "user": {
            "id": "user-uuid",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe"
        }
    }
}
```

#### POST /api/auth/logout
Destroy user session.

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

## 6. Business Logic

### 6.1 Product Management Logic

#### Stock Management
```javascript
class StockManager {
    async validateStockAvailability(productId, requestedQuantity) {
        const product = await productRepository.findById(productId);
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (product.stock_quantity < requestedQuantity) {
            throw new Error(`Only ${product.stock_quantity} items available`);
        }
        
        if (requestedQuantity > product.max_order_quantity) {
            throw new Error(`Maximum order quantity is ${product.max_order_quantity}`);
        }
        
        return true;
    }
    
    async reserveStock(productId, quantity) {
        // Implement optimistic locking
        const product = await productRepository.findById(productId);
        
        if (product.stock_quantity < quantity) {
            throw new Error('Insufficient stock');
        }
        
        await productRepository.updateStock(productId, -quantity);
    }
    
    async releaseStock(productId, quantity) {
        await productRepository.updateStock(productId, quantity);
    }
}
```

### 6.2 Shopping Cart Business Logic

#### Cart Operations
```javascript
class CartBusinessLogic {
    async addItemToCart(userId, productId, quantity) {
        // Validate product exists
        const product = await productService.getProductById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Check stock availability
        const stockAvailable = await productService.checkStockAvailability(
            productId, 
            quantity
        );
        
        if (!stockAvailable) {
            throw new Error('Insufficient stock or exceeds maximum order quantity');
        }
        
        // Get or create cart
        let cart = await cartRepository.findByUserId(userId);
        if (!cart) {
            cart = await cartRepository.create(userId);
        }
        
        // Check if item already exists in cart
        const existingItem = cart.items.find(item => item.product_id === productId);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            
            // Validate new quantity
            if (newQuantity > product.max_order_quantity) {
                throw new Error(`Maximum order quantity is ${product.max_order_quantity}`);
            }
            
            const stockCheck = await productService.checkStockAvailability(
                productId, 
                newQuantity
            );
            
            if (!stockCheck) {
                throw new Error('Insufficient stock for requested quantity');
            }
            
            await cartRepository.updateItemQuantity(cart.id, existingItem.id, newQuantity);
        } else {
            await cartRepository.addItem(cart.id, productId, quantity, product.price);
        }
        
        // Invalidate cache
        await cacheService.delete(`cart:${userId}`);
        
        return await cartService.getCartByUserId(userId);
    }
    
    async validateCartBeforeCheckout(userId) {
        const cart = await cartService.getCartByUserId(userId);
        
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }
        
        // Validate each item
        for (const item of cart.items) {
            const product = await productService.getProductById(item.product_id);
            
            if (!product) {
                throw new Error(`Product ${item.product_id} no longer available`);
            }
            
            if (product.stock_quantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}. Only ${product.stock_quantity} available`
                );
            }
            
            if (item.quantity > product.max_order_quantity) {
                throw new Error(
                    `${product.name} exceeds maximum order quantity of ${product.max_order_quantity}`
                );
            }
            
            // Check if price has changed
            if (item.price !== product.price) {
                // Update cart item with new price
                await cartRepository.updateItemPrice(item.id, product.price);
            }
        }
        
        return true;
    }
}
```

### 6.3 Price Calculation

```javascript
class PriceCalculator {
    calculateCartTotal(cartItems) {
        return cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    calculateItemSubtotal(price, quantity) {
        return price * quantity;
    }
    
    applyDiscount(total, discountPercentage) {
        return total * (1 - discountPercentage / 100);
    }
}
```

## 7. Security Design

### 7.1 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant SessionMgr
    participant DB
    
    Client->>API: POST /auth/login
    API->>Auth: Validate credentials
    Auth->>DB: Query user
    DB-->>Auth: User data
    Auth->>Auth: Verify password
    Auth->>Auth: Generate JWT
    Auth->>SessionMgr: Create session
    SessionMgr->>SessionMgr: Generate session ID
    SessionMgr-->>Auth: Session ID
    Auth-->>API: JWT + Session ID
    API-->>Client: Token + Session ID
    
    Client->>API: GET /products (with JWT + Session ID)
    API->>Auth: Verify JWT
    Auth-->>API: Valid
    API->>SessionMgr: Validate session
    SessionMgr-->>API: Valid
    API->>API: Process request
    API-->>Client: Response
```

### 7.2 JWT Token Structure

```javascript
// Token payload
{
    "sub": "user-uuid",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234571490,
    "roles": ["user"]
}
```

### 7.3 Session Management

```javascript
// Session data structure in Redis
{
    "userId": "user-uuid",
    "email": "user@example.com",
    "roles": ["user"],
    "createdAt": 1234567890,
    "lastActivity": 1234567890,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
}
```

### 7.4 Security Middleware Chain

```javascript
// Security middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS configuration
app.use(rateLimit(rateLimitOptions)); // Rate limiting
app.use(authMiddleware); // JWT validation
app.use(sessionMiddleware); // Session validation
app.use(csrfProtection); // CSRF protection
```

## 8. Testing Strategy

### 8.1 Unit Tests

#### Product Service Tests
```javascript
// tests/services/productService.test.js
describe('ProductService', () => {
    describe('getProducts', () => {
        it('should return paginated products', async () => {
            const result = await productService.getProducts(1, 20, {});
            expect(result).toHaveProperty('products');
            expect(result).toHaveProperty('pagination');
            expect(result.products).toBeInstanceOf(Array);
        });
        
        it('should filter products by category', async () => {
            const result = await productService.getProducts(1, 20, { 
                category: 'electronics' 
            });
            result.products.forEach(product => {
                expect(product.category).toBe('electronics');
            });
        });
        
        it('should filter products by price range', async () => {
            const result = await productService.getProducts(1, 20, { 
                minPrice: 100,
                maxPrice: 1000
            });
            result.products.forEach(product => {
                expect(product.price).toBeGreaterThanOrEqual(100);
                expect(product.price).toBeLessThanOrEqual(1000);
            });
        });
    });
    
    describe('checkStockAvailability', () => {
        it('should return true when stock is available', async () => {
            const available = await productService.checkStockAvailability(
                'product-id',
                5
            );
            expect(available).toBe(true);
        });
        
        it('should return false when quantity exceeds max_order_quantity', async () => {
            const available = await productService.checkStockAvailability(
                'product-id',
                100
            );
            expect(available).toBe(false);
        });
        
        it('should return false when stock is insufficient', async () => {
            const available = await productService.checkStockAvailability(
                'product-id',
                1000
            );
            expect(available).toBe(false);
        });
    });
});
```

#### Shopping Cart Service Tests
```javascript
// tests/services/cartService.test.js
describe('CartService', () => {
    describe('addItemToCart', () => {
        it('should add new item to cart', async () => {
            const cart = await cartService.addItemToCart(
                'user-id',
                'product-id',
                2
            );
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(2);
        });
        
        it('should update quantity if item already exists', async () => {
            await cartService.addItemToCart('user-id', 'product-id', 2);
            const cart = await cartService.addItemToCart('user-id', 'product-id', 3);
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(5);
        });
        
        it('should throw error when stock is insufficient', async () => {
            await expect(
                cartService.addItemToCart('user-id', 'product-id', 1000)
            ).rejects.toThrow('Insufficient stock');
        });
        
        it('should throw error when exceeding max_order_quantity', async () => {
            await expect(
                cartService.addItemToCart('user-id', 'product-id', 100)
            ).rejects.toThrow('Maximum order quantity');
        });
    });
    
    describe('updateCartItemQuantity', () => {
        it('should update item quantity', async () => {
            const cart = await cartService.updateCartItemQuantity(
                'user-id',
                'item-id',
                5
            );
            const item = cart.items.find(i => i.id === 'item-id');
            expect(item.quantity).toBe(5);
        });
        
        it('should validate stock before updating', async () => {
            await expect(
                cartService.updateCartItemQuantity('user-id', 'item-id', 1000)
            ).rejects.toThrow('Insufficient stock');
        });
    });
    
    describe('removeItemFromCart', () => {
        it('should remove item from cart', async () => {
            const cart = await cartService.removeItemFromCart(
                'user-id',
                'item-id'
            );
            const item = cart.items.find(i => i.id === 'item-id');
            expect(item).toBeUndefined();
        });
    });
});
```

### 8.2 Integration Tests

```javascript
// tests/integration/cart.test.js
describe('Shopping Cart Integration Tests', () => {
    let authToken;
    let sessionId;
    let productId;
    
    beforeAll(async () => {
        // Login and get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        
        authToken = loginResponse.body.data.token;
        sessionId = loginResponse.body.data.sessionId;
        
        // Create a test product
        const productResponse = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Session-ID', sessionId)
            .send({
                name: 'Test Product',
                price: 99.99,
                stock_quantity: 100,
                max_order_quantity: 10,
                category: 'test'
            });
        
        productId = productResponse.body.data.id;
    });
    
    it('should complete full cart workflow', async () => {
        // Add item to cart
        const addResponse = await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Session-ID', sessionId)
            .send({
                productId: productId,
                quantity: 2
            });
        
        expect(addResponse.status).toBe(200);
        expect(addResponse.body.success).toBe(true);
        expect(addResponse.body.data.items).toHaveLength(1);
        
        const itemId = addResponse.body.data.items[0].id;
        
        // Update quantity
        const updateResponse = await request(app)
            .put(`/api/cart/items/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Session-ID', sessionId)
            .send({
                quantity: 5
            });
        
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data.items[0].quantity).toBe(5);
        
        // Get cart
        const getResponse = await request(app)
            .get('/api/cart')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Session-ID', sessionId);
        
        expect(getResponse.status).toBe(200);
        expect(getResponse.body.data.items).toHaveLength(1);
        
        // Remove item
        const removeResponse = await request(app)
            .delete(`/api/cart/items/${itemId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Session-ID', sessionId);
        
        expect(removeResponse.status).toBe(200);
        expect(removeResponse.body.data.items).toHaveLength(0);
    });
});
```

### 8.3 End-to-End Tests

```javascript
// tests/e2e/shopping-flow.test.js
describe('E2E: Complete Shopping Flow', () => {
    it('should allow user to browse, add to cart, and checkout', async () => {
        // Navigate to products page
        await page.goto('http://localhost:3000/products');
        
        // Search for product
        await page.type('#search-input', 'laptop');
        await page.click('#search-button');
        
        // Wait for results
        await page.waitForSelector('.product-card');
        
        // Click on first product
        await page.click('.product-card:first-child');
        
        // Add to cart
        await page.waitForSelector('#add-to-cart-button');
        await page.click('#add-to-cart-button');
        
        // Verify cart badge updated
        const cartBadge = await page.$eval('.cart-badge', el => el.textContent);
        expect(cartBadge).toBe('1');
        
        // Go to cart
        await page.click('.cart-icon');
        await page.waitForSelector('.cart-item');
        
        // Verify item in cart
        const cartItems = await page.$$('.cart-item');
        expect(cartItems.length).toBe(1);
        
        // Update quantity
        await page.click('.quantity-increase');
        await page.waitForTimeout(500);
        
        const quantity = await page.$eval('.quantity-input', el => el.value);
        expect(quantity).toBe('2');
        
        // Proceed to checkout
        await page.click('.checkout-button');
        await page.waitForSelector('.checkout-form');
    });
});
```

## 9. Deployment Architecture

### 9.1 Infrastructure Diagram

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Application Tier"
            API1[API Server 1]
            API2[API Server 2]
            API3[API Server 3]
        end
        
        subgraph "Cache Layer"
            Redis1[Redis Master]
            Redis2[Redis Replica]
        end
        
        subgraph "Database Layer"
            PG1[PostgreSQL Primary]
            PG2[PostgreSQL Standby]
        end
        
        subgraph "Session Store"
            Session1[Redis Session Master]
            Session2[Redis Session Replica]
        end
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    Redis1 --> Redis2
    
    API1 --> PG1
    API2 --> PG1
    API3 --> PG1
    PG1 --> PG2
    
    API1 --> Session1
    API2 --> Session1
    API3 --> Session1
    Session1 --> Session2
```

### 9.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/ecommerce
      - REDIS_URL=redis://redis:6379
      - SESSION_REDIS_URL=redis://session-redis:6379
    depends_on:
      - postgres
      - redis
      - session-redis
    
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
  
  session-redis:
    image: redis:7-alpine
    volumes:
      - session-redis-data:/data

volumes:
  postgres-data:
  redis-data:
  session-redis-data:
```

### 9.3 Environment Configuration

```javascript
// config/index.js
module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    database: {
        url: process.env.DATABASE_URL,
        pool: {
            min: 2,
            max: 10
        }
    },
    
    redis: {
        url: process.env.REDIS_URL,
        ttl: 300
    },
    
    session: {
        redisUrl: process.env.SESSION_REDIS_URL,
        ttl: 3600,
        secret: process.env.SESSION_SECRET
    },
    
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h'
    },
    
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
};
```

## Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the E-commerce Product Management System with Shopping Cart functionality. The design emphasizes:

- **Scalability**: Horizontal scaling with load balancing and caching
- **Security**: JWT authentication with Redis-based session management
- **Maintainability**: Clean architecture with separation of concerns
- **Performance**: Caching strategies and optimized database queries
- **Reliability**: Error handling, validation, and comprehensive testing
- **Stock Management**: Enhanced product entity with stock_quantity and max_order_quantity fields
- **Cart Management**: Complete shopping cart functionality with validation and business logic

All components are designed to work together seamlessly while maintaining loose coupling and high cohesion.