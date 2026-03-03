# Low-Level Design (LLD) - E-commerce Product Management System

## 1. Project Overview

**Project Name:** E-commerce Product Management System  
**Module:** ProductManagement and ShoppingCart  
**Version:** 1.0  
**Date:** 2024-01-15  
**Author:** Development Team

### Purpose
This document provides a detailed low-level design for the E-commerce Product Management System, focusing on the technical implementation of product catalog management, inventory tracking, and shopping cart functionality.

### Scope
- Product CRUD operations
- Category management
- Inventory tracking
- Shopping cart management
- Price management
- Product search and filtering

## 2. System Architecture

### 2.1 Architecture Overview
The system follows a layered architecture pattern with clear separation of concerns:

**Architecture Description:** The system architecture includes both Product-related and Cart-related components. The Class Diagram below shows the complete system including CartController, CartService, CartRepository, CartItemRepository, Cart, and CartItem entities with all their relationships to the Product entity and Cart management layers.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (ProductController, CategoryController, CartController)     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│   (ProductService, CategoryService, CartService,             │
│    InventoryService)                                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│  (ProductRepository, CategoryRepository, CartRepository,     │
│   CartItemRepository, InventoryRepository)                   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│              (MySQL Database)                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack
- **Backend Framework:** Spring Boot 3.x
- **Language:** Java 17
- **Database:** MySQL 8.0
- **ORM:** Spring Data JPA / Hibernate
- **API Documentation:** Swagger/OpenAPI
- **Build Tool:** Maven
- **Testing:** JUnit 5, Mockito

## 3. Class Diagram

```
┌─────────────────────────┐
│   ProductController     │
├─────────────────────────┤
│ - productService        │
├─────────────────────────┤
│ + createProduct()       │
│ + updateProduct()       │
│ + deleteProduct()       │
│ + getProduct()          │
│ + getAllProducts()      │
│ + searchProducts()      │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│    ProductService       │
├─────────────────────────┤
│ - productRepository     │
│ - inventoryService      │
├─────────────────────────┤
│ + createProduct()       │
│ + updateProduct()       │
│ + deleteProduct()       │
│ + getProductById()      │
│ + getAllProducts()      │
│ + searchProducts()      │
│ + updateInventory()     │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│   ProductRepository     │
├─────────────────────────┤
│ + save()                │
│ + findById()            │
│ + findAll()             │
│ + delete()              │
│ + findByCategory()      │
│ + searchByName()        │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│       Product           │
├─────────────────────────┤
│ - id: Long              │
│ - name: String          │
│ - description: String   │
│ - price: BigDecimal     │
│ - sku: String           │
│ - category: Category    │
│ - inventory: Inventory  │
│ - createdAt: DateTime   │
│ - updatedAt: DateTime   │
├─────────────────────────┤
│ + getId()               │
│ + setName()             │
│ + getPrice()            │
│ + updateInventory()     │
└─────────────────────────┘
            │
            │ 1:1
            ▼
┌─────────────────────────┐
│      Inventory          │
├─────────────────────────┤
│ - id: Long              │
│ - product: Product      │
│ - quantity: Integer     │
│ - reservedQty: Integer  │
│ - availableQty: Integer │
│ - lastUpdated: DateTime │
├─────────────────────────┤
│ + updateQuantity()      │
│ + reserveStock()        │
│ + releaseStock()        │
└─────────────────────────┘

┌─────────────────────────┐
│   CategoryController    │
├─────────────────────────┤
│ - categoryService       │
├─────────────────────────┤
│ + createCategory()      │
│ + updateCategory()      │
│ + deleteCategory()      │
│ + getCategory()         │
│ + getAllCategories()    │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│    CategoryService      │
├─────────────────────────┤
│ - categoryRepository    │
├─────────────────────────┤
│ + createCategory()      │
│ + updateCategory()      │
│ + deleteCategory()      │
│ + getCategoryById()     │
│ + getAllCategories()    │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│   CategoryRepository    │
├─────────────────────────┤
│ + save()                │
│ + findById()            │
│ + findAll()             │
│ + delete()              │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│       Category          │
├─────────────────────────┤
│ - id: Long              │
│ - name: String          │
│ - description: String   │
│ - parentCategory: Cat.  │
│ - products: List<Prod>  │
├─────────────────────────┤
│ + getId()               │
│ + getName()             │
│ + addProduct()          │
└─────────────────────────┘

┌─────────────────────────┐
│    CartController       │
├─────────────────────────┤
│ - cartService           │
├─────────────────────────┤
│ + addToCart()           │
│ + removeFromCart()      │
│ + updateCartItem()      │
│ + getCart()             │
│ + clearCart()           │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│      CartService        │
├─────────────────────────┤
│ - cartRepository        │
│ - cartItemRepository    │
│ - productService        │
├─────────────────────────┤
│ + addItemToCart()       │
│ + removeItemFromCart()  │
│ + updateCartItemQty()   │
│ + getCartByUserId()     │
│ + clearCart()           │
│ + calculateTotal()      │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│    CartRepository       │
├─────────────────────────┤
│ + save()                │
│ + findById()            │
│ + findByUserId()        │
│ + delete()              │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│         Cart            │
├─────────────────────────┤
│ - id: Long              │
│ - userId: Long          │
│ - cartItems: List<Item> │
│ - totalAmount: BigDec   │
│ - createdAt: DateTime   │
│ - updatedAt: DateTime   │
├─────────────────────────┤
│ + addItem()             │
│ + removeItem()          │
│ + calculateTotal()      │
│ + clear()               │
└─────────────────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│  CartItemRepository     │
├─────────────────────────┤
│ + save()                │
│ + findById()            │
│ + findByCartId()        │
│ + delete()              │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│       CartItem          │
├─────────────────────────┤
│ - id: Long              │
│ - cart: Cart            │
│ - product: Product      │
│ - quantity: Integer     │
│ - price: BigDecimal     │
│ - subtotal: BigDecimal  │
├─────────────────────────┤
│ + updateQuantity()      │
│ + calculateSubtotal()   │
└─────────────────────────┘
            │ N:1
            ▼
        [Product]
```

## 4. Database Schema

### 4.1 Products Table
```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### 4.2 Categories Table
```sql
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);
```

### 4.3 Inventory Table
```sql
CREATE TABLE inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT UNIQUE NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 4.4 Carts Table
```sql
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_cart (user_id)
);
```

### 4.5 Cart Items Table
```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * price),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);
```

## 5. API Endpoints

### 5.1 Product Management APIs

#### Create Product
- **Endpoint:** `POST /api/v1/products`
- **Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "sku": "PROD-001",
  "categoryId": 1,
  "initialStock": 100
}
```
- **Response:** `201 Created`

#### Get Product
- **Endpoint:** `GET /api/v1/products/{id}`
- **Response:** `200 OK`

#### Update Product
- **Endpoint:** `PUT /api/v1/products/{id}`
- **Request Body:** Same as Create
- **Response:** `200 OK`

#### Delete Product
- **Endpoint:** `DELETE /api/v1/products/{id}`
- **Response:** `204 No Content`

#### Search Products
- **Endpoint:** `GET /api/v1/products/search?name={name}&category={categoryId}`
- **Response:** `200 OK`

### 5.2 Cart Management APIs

#### Add to Cart
- **Endpoint:** `POST /api/v1/carts/{userId}/items`
- **Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```
- **Response:** `201 Created`

#### Get Cart
- **Endpoint:** `GET /api/v1/carts/{userId}`
- **Response:** `200 OK`

#### Update Cart Item
- **Endpoint:** `PUT /api/v1/carts/{userId}/items/{itemId}`
- **Request Body:**
```json
{
  "quantity": 3
}
```
- **Response:** `200 OK`

#### Remove from Cart
- **Endpoint:** `DELETE /api/v1/carts/{userId}/items/{itemId}`
- **Response:** `204 No Content`

#### Clear Cart
- **Endpoint:** `DELETE /api/v1/carts/{userId}`
- **Response:** `204 No Content`

## 6. Sequence Diagrams

### 6.1 Create Product Flow
```
User -> ProductController: POST /api/v1/products
ProductController -> ProductService: createProduct(productDTO)
ProductService -> ProductRepository: save(product)
ProductRepository -> Database: INSERT INTO products
Database -> ProductRepository: product saved
ProductService -> InventoryService: createInventory(productId, initialStock)
InventoryService -> InventoryRepository: save(inventory)
InventoryRepository -> Database: INSERT INTO inventory
Database -> InventoryRepository: inventory saved
InventoryRepository -> InventoryService: inventory
InventoryService -> ProductService: inventory
ProductService -> ProductController: productDTO
ProductController -> User: 201 Created
```

### 6.2 Add to Cart Flow
```
User -> CartController: POST /api/v1/carts/{userId}/items
CartController -> CartService: addItemToCart(userId, productId, quantity)
CartService -> CartRepository: findByUserId(userId)
CartRepository -> Database: SELECT * FROM carts WHERE user_id = ?
Database -> CartRepository: cart or null
CartRepository -> CartService: cart or null
CartService -> ProductService: getProductById(productId)
ProductService -> ProductRepository: findById(productId)
ProductRepository -> Database: SELECT * FROM products WHERE id = ?
Database -> ProductRepository: product
ProductRepository -> ProductService: product
ProductService -> CartService: product
CartService -> CartItemRepository: save(cartItem)
CartItemRepository -> Database: INSERT INTO cart_items
Database -> CartItemRepository: cartItem saved
CartItemRepository -> CartService: cartItem
CartService -> CartRepository: save(cart)
CartRepository -> Database: UPDATE carts SET total_amount = ?
Database -> CartRepository: cart updated
CartRepository -> CartService: cart
CartService -> CartController: cartDTO
CartController -> User: 201 Created
```
