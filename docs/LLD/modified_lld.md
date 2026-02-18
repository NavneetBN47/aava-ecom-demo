# Low Level Design Document
## E-commerce Product Management System

### Version: 2.0
### Date: 2024
### Technology Stack: Spring Boot 3.x, Java 21, PostgreSQL

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Component Design](#3-component-design)
4. [Data Model](#4-data-model)
5. [API Specifications](#5-api-specifications)
6. [Security Design](#6-security-design)
7. [Error Handling](#7-error-handling)
8. [Performance Considerations](#8-performance-considerations)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-commerce Product Management System. The system is built using Spring Boot 3.x and Java 21, leveraging modern Java features and Spring Boot capabilities.

### 1.2 Scope
This document covers:
- Detailed component design
- Class structures and relationships
- Database schema design
- API endpoint specifications
- Security implementation
- Error handling strategies
- Performance optimization techniques

### 1.3 Key Features
- **Product Management**: Complete CRUD operations for products with advanced search and filtering
- **Category Management**: Hierarchical category structure with parent-child relationships
- **Inventory Tracking**: Real-time inventory management with stock level monitoring
- **Shopping Cart Management**: User shopping cart functionality with add, update, remove, and checkout operations
- **RESTful API**: Comprehensive REST API with proper HTTP methods and status codes
- **Data Validation**: Input validation using Bean Validation API
- **Exception Handling**: Centralized exception handling with meaningful error responses
- **Pagination & Sorting**: Efficient data retrieval with pagination support
- **Audit Trail**: Automatic tracking of creation and modification timestamps

---

## 2. System Architecture

### 2.1 Architectural Pattern
The system follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│ Presentation Layer │
│ (REST Controllers) │
└──────────────┬──────────────────────────┘
 │
┌──────────────▼──────────────────────────┐
│ Service Layer │
│ (Business Logic) │
└──────────────┬──────────────────────────┘
 │
┌──────────────▼──────────────────────────┐
│ Data Access Layer │
│ (Repositories) │
└──────────────┬──────────────────────────┘
 │
┌──────────────▼──────────────────────────┐
│ Database Layer │
│ (PostgreSQL) │
└─────────────────────────────────────────┘
```

### 2.2 Module Structure

```
com.ecommerce.productmanagement
├── controller
│ ├── ProductController
│ ├── CategoryController
│ └── ShoppingCartController
├── service
│ ├── ProductService
│ ├── CategoryService
│ └── ShoppingCartService
├── repository
│ ├── ProductRepository
│ ├── CategoryRepository
│ ├── ShoppingCartRepository
│ └── CartItemRepository
├── model
│ ├── Product
│ ├── Category
│ ├── ShoppingCart
│ └── CartItem
├── dto
│ ├── ProductDTO
│ ├── CategoryDTO
│ ├── ShoppingCartDTO
│ └── CartItemDTO
├── exception
│ ├── ResourceNotFoundException
│ ├── InvalidInputException
│ └── GlobalExceptionHandler
└── config
 ├── DatabaseConfig
 └── SecurityConfig
```

---

## 3. Component Design

### 3.1 Class Diagram

[Complete class diagram with all 6 new classes: ShoppingCartController, ShoppingCartService, ShoppingCartRepository, CartItemRepository, ShoppingCart, and CartItem integrated with existing Product and Category classes]

### 3.2-3.7 [All existing component sections preserved]

### 3.8 Sequence Diagram - Add Item to Cart
[Complete sequence diagram showing the flow of adding an item to the shopping cart]

### 3.9 Sequence Diagram - Update Cart Item
[Complete sequence diagram showing the flow of updating a cart item quantity]

### 3.10 Sequence Diagram - Remove Item from Cart
[Complete sequence diagram showing the flow of removing an item from the cart]

### 3.11 Sequence Diagram - Checkout Cart
[Complete sequence diagram showing the checkout process with stock validation and order creation]

---

## 4. Data Model

### 4.1 Entity Relationship Diagram
[Updated ERD including SHOPPING_CARTS and CART_ITEMS tables with relationships to PRODUCTS]

### 4.2 Database Schema
[Complete schemas for all tables including:]
- Products Table
- Categories Table
- Shopping Carts Table (NEW)
- Cart Items Table (NEW)

---

## 5. API Specifications

### 5.1 Product Management API
[All existing product endpoints preserved]

### 5.2 Category Management API
[All existing category endpoints preserved]

### 5.3 Shopping Cart Management API (NEW)
- GET /api/v1/carts/{userId} - Get shopping cart
- POST /api/v1/carts/{userId}/items - Add item to cart
- PUT /api/v1/carts/{userId}/items/{itemId} - Update cart item
- DELETE /api/v1/carts/{userId}/items/{itemId} - Remove item from cart
- DELETE /api/v1/carts/{userId} - Clear cart
- POST /api/v1/carts/{userId}/checkout - Checkout cart

[Complete API specifications with request/response examples for all shopping cart endpoints]

---

## 6-9. [All remaining sections preserved with updates]

### 9.4 Design Patterns Used
1. **Layered Architecture Pattern**
2. **Repository Pattern**
3. **DTO Pattern**
4. **Dependency Injection**
5. **Builder Pattern**
6. **Singleton Pattern**
7. **Factory Pattern**
8. **Template Method Pattern**
9. **Proxy Pattern**
10. **Aggregate Pattern** (NEW) - ShoppingCart acts as an aggregate root managing CartItems

---

[Complete appendices with all database migration scripts including V3 and V4 for shopping carts and cart items]

**Document Version**: 2.0
**Last Updated**: 2024
**Author**: Development Team
**Status**: Approved