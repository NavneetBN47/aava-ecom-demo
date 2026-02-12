# E-Commerce System - High Level Design

## System Overview

This document contains the High Level Design (HLD) for the E-Commerce Spring Boot Application. The system follows a layered microservice architecture pattern using Spring Boot 3.3.0, PostgreSQL, and Java 21.

## Architecture Diagrams

### 1. System Context Diagram

The following diagram shows the high-level view of the E-Commerce System and its interactions with users and external systems:

```mermaid
C4Context
    title System Context Diagram for E-Commerce System
    
    Person(user, "Customer", "A customer who wants to browse and purchase products")
    
    System(ecommerce, "E-Commerce System", "Allows customers to view products, manage inventory, and process orders")
    
    System_Ext(payment, "Payment Gateway", "External payment processing system")
    System_Ext(shipping, "Shipping Provider", "External shipping and logistics system")
    System_Ext(inventory, "Inventory Management", "External inventory tracking system")
    
    Rel(user, ecommerce, "Uses", "HTTPS")
    Rel(ecommerce, payment, "Processes payments", "HTTPS/API")
    Rel(ecommerce, shipping, "Manages shipping", "HTTPS/API")
    Rel(ecommerce, inventory, "Syncs inventory", "HTTPS/API")
    
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

### 2. Container Diagram

The following diagram shows the internal structure of the E-Commerce System, including its containers and their interactions:

```mermaid
C4Container
    title Container Diagram for E-Commerce System
    
    Person(user, "Customer", "A customer who wants to browse and purchase products")
    
    System_Boundary(c1, "E-Commerce System") {
        Container(web, "Web Application", "React/Angular", "Delivers the static content and e-commerce single page application")
        Container(mobile, "Mobile App", "React Native/Flutter", "Provides e-commerce functionality via mobile devices")
        Container(api, "Product Management Service", "Spring Boot 3.3.0, Java 21", "Provides product management functionality via JSON/HTTPS API. Contains ProductController, ProductService, ProductRepository, Product Entity")
        ContainerDb(db, "Database", "PostgreSQL", "Stores product information including id, name, description, price, stock, image_url, category")
    }
    
    System_Ext(payment, "Payment Gateway", "External payment processing system")
    System_Ext(shipping, "Shipping Provider", "External shipping and logistics system")
    
    Rel(user, web, "Uses", "HTTPS")
    Rel(user, mobile, "Uses", "HTTPS")
    
    Rel(web, api, "Makes API calls to", "JSON/HTTPS")
    Rel(mobile, api, "Makes API calls to", "JSON/HTTPS")
    
    Rel(api, db, "Reads from and writes to", "JDBC")
    
    Rel(api, payment, "Processes payments", "JSON/HTTPS")
    Rel(api, shipping, "Manages shipping", "JSON/HTTPS")
    
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## Data Flow Description

The system follows these primary data flows:

1. **User Interaction Flow:**
   - User interacts with Web/Mobile App via HTTPS
   - Web/Mobile App renders UI and handles user interactions

2. **API Communication Flow:**
   - Web/Mobile App sends requests to Product Management Service via JSON/REST over HTTPS
   - Product Management Service processes business logic through ProductService
   - ProductController handles REST API endpoints

3. **Data Persistence Flow:**
   - Product Management Service connects to PostgreSQL Database via JDBC
   - ProductRepository handles CRUD operations
   - Database returns Result Sets to Product Management Service

4. **Response Flow:**
   - Product Management Service sends JSON responses back to Web/Mobile App
   - Web/Mobile App processes responses and updates UI
   - User sees updated content through UI rendering

## Technical Components

### Product Management Service Components:
- **ProductController**: Handles REST API endpoints
- **ProductService**: Contains business logic
- **ProductRepository**: Manages data access layer
- **Product Entity**: Represents product data model

### Database Schema:
- **Products Table Fields:**
  - id (Primary Key)
  - name
  - description
  - price
  - stock
  - image_url
  - category

### Key Features:
- CRUD operations for products
- Product search and filtering
- Data validation
- RESTful API design
- Microservice architecture
- Layered application structure

## Technology Stack

- **Backend**: Spring Boot 3.3.0, Java 21
- **Database**: PostgreSQL
- **Architecture**: Layered Microservice
- **Communication**: REST API, JSON, HTTPS
- **Data Access**: JDBC, Spring Data JPA