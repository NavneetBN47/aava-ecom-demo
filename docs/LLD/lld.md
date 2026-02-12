# Low-Level Design (LLD) - E-Commerce Spring Boot Application

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Database Design](#database-design)
4. [Business Logic Flows](#business-logic-flows)
5. [API Specifications](#api-specifications)

## System Overview

### Project Configuration
- **Framework**: Spring Boot 3.3.0
- **Java Version**: 21
- **Database**: PostgreSQL
- **Server Port**: 8080
- **Module**: ProductManagement

### Architecture Pattern
This application follows a layered architecture pattern with clear separation of concerns:
- **Controller Layer**: REST API endpoints
- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access abstraction
- **Entity Layer**: Data model representation

## Architecture Diagrams

### Class Diagram

```mermaid
classDiagram
    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity~List~Product~~
        +getProductById(Long id) ResponseEntity~Product~
        +createProduct(Product product) ResponseEntity~Product~
        +updateProduct(Long id, Product product) ResponseEntity~Product~
        +deleteProduct(Long id) ResponseEntity~Void~
        +getProductsByCategory(String category) ResponseEntity~List~Product~~
        +searchProducts(String name) ResponseEntity~List~Product~~
    }
    
    class ProductService {
        -ProductRepository productRepository
        +getAllProducts() List~Product~
        +getProductById(Long id) Optional~Product~
        +createProduct(Product product) Product
        +updateProduct(Long id, Product product) Product
        +deleteProduct(Long id) void
        +getProductsByCategory(String category) List~Product~
        +searchProducts(String name) List~Product~
    }
    
    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findById(Long id) Optional~Product~
        +save(Product product) Product
        +deleteById(Long id) void
        +findByCategory(String category) List~Product~
        +findByNameContainingIgnoreCase(String name) List~Product~
    }
    
    class Product {
        -Long id
        -String name
        -String description
        -Double price
        -Integer stock
        -String imageUrl
        -String category
        +getId() Long
        +setId(Long id) void
        +getName() String
        +setName(String name) void
        +getDescription() String
        +setDescription(String description) void
        +getPrice() Double
        +setPrice(Double price) void
        +getStock() Integer
        +setStock(Integer stock) void
        +getImageUrl() String
        +setImageUrl(String imageUrl) void
        +getCategory() String
        +setCategory(String category) void
    }
    
    ProductController --> ProductService : uses
    ProductService --> ProductRepository : uses
    ProductRepository --> Product : manages
    ProductService --> Product : processes
```

### Component Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        C[Client Applications]
    end
    
    subgraph "Spring Boot Application"
        subgraph "Controller Layer"
            PC[ProductController]
        end
        
        subgraph "Service Layer"
            PS[ProductService]
        end
        
        subgraph "Repository Layer"
            PR[ProductRepository]
        end
        
        subgraph "Entity Layer"
            PE[Product Entity]
        end
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL Database)]
    end
    
    C -->|HTTP Requests| PC
    PC -->|Business Logic| PS
    PS -->|Data Access| PR
    PR -->|JPA/Hibernate| DB
    PE -.->|Maps to| DB
```

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    PRODUCTS {
        BIGINT id PK "Auto Generated"
        VARCHAR name "Not Null"
        VARCHAR description "Max Length 1000"
        DOUBLE price "Not Null"
        INTEGER stock "Not Null"
        VARCHAR image_url "Nullable"
        VARCHAR category "Not Null"
    }
```

### Database Schema Details

**Table: products**
- **id**: Primary Key, Auto-generated Long value
- **name**: Product name, Required field
- **description**: Product description, Maximum 1000 characters
- **price**: Product price, Required Double value
- **stock**: Available stock quantity, Required Integer
- **image_url**: Product image URL, Optional field
- **category**: Product category, Required field

## Business Logic Flows

### Get All Products Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products
    ProductController->>ProductService: getAllProducts()
    ProductService->>ProductRepository: findAll()
    ProductRepository->>Database: SELECT * FROM products
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: ResponseEntity<List<Product>>
```

### Get Product By ID Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/{id}
    ProductController->>ProductService: getProductById(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Optional<Product>
    ProductRepository-->>ProductService: Optional<Product>
    ProductService-->>ProductController: Optional<Product>
    ProductController-->>Client: ResponseEntity<Product>
```

### Create Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: POST /api/products (Product)
    ProductController->>ProductService: createProduct(product)
    ProductService->>ProductRepository: save(product)
    ProductRepository->>Database: INSERT INTO products (...)
    Database-->>ProductRepository: Product (with generated ID)
    ProductRepository-->>ProductService: Product
    ProductService-->>ProductController: Product
    ProductController-->>Client: ResponseEntity<Product>
```

### Update Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: PUT /api/products/{id} (Product)
    ProductController->>ProductService: updateProduct(id, product)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Optional<Product>
    ProductRepository-->>ProductService: Optional<Product>
    
    alt Product exists
        ProductService->>ProductService: Update product fields
        ProductService->>ProductRepository: save(updatedProduct)
        ProductRepository->>Database: UPDATE products SET ... WHERE id = ?
        Database-->>ProductRepository: Updated Product
        ProductRepository-->>ProductService: Updated Product
        ProductService-->>ProductController: Updated Product
        ProductController-->>Client: ResponseEntity<Product>
    else Product not found
        ProductService-->>ProductController: RuntimeException
        ProductController-->>Client: 404 Not Found
    end
```

### Delete Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: DELETE /api/products/{id}
    ProductController->>ProductService: deleteProduct(id)
    ProductService->>ProductRepository: findById(id)
    ProductRepository->>Database: SELECT * FROM products WHERE id = ?
    Database-->>ProductRepository: Optional<Product>
    ProductRepository-->>ProductService: Optional<Product>
    
    alt Product exists
        ProductService->>ProductRepository: deleteById(id)
        ProductRepository->>Database: DELETE FROM products WHERE id = ?
        Database-->>ProductRepository: Success
        ProductRepository-->>ProductService: void
        ProductService-->>ProductController: void
        ProductController-->>Client: ResponseEntity<Void> (204 No Content)
    else Product not found
        ProductService-->>ProductController: RuntimeException
        ProductController-->>Client: 404 Not Found
    end
```

### Get Products By Category Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/category/{category}
    ProductController->>ProductService: getProductsByCategory(category)
    ProductService->>ProductRepository: findByCategory(category)
    ProductRepository->>Database: SELECT * FROM products WHERE category = ?
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: ResponseEntity<List<Product>>
```

### Search Products Flow

```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository
    participant Database
    
    Client->>ProductController: GET /api/products/search?name={name}
    ProductController->>ProductService: searchProducts(name)
    ProductService->>ProductRepository: findByNameContainingIgnoreCase(name)
    ProductRepository->>Database: SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)
    Database-->>ProductRepository: List<Product>
    ProductRepository-->>ProductService: List<Product>
    ProductService-->>ProductController: List<Product>
    ProductController-->>Client: ResponseEntity<List<Product>>
```

## API Specifications

### REST Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/products` | Get all products | None | List<Product> |
| GET | `/api/products/{id}` | Get product by ID | None | Product |
| POST | `/api/products` | Create new product | Product | Product |
| PUT | `/api/products/{id}` | Update existing product | Product | Product |
| DELETE | `/api/products/{id}` | Delete product | None | Void |
| GET | `/api/products/category/{category}` | Get products by category | None | List<Product> |
| GET | `/api/products/search?name={name}` | Search products by name | None | List<Product> |

### Data Transfer Objects

**Product Model:**
```json
{
  "id": "Long (Auto-generated)",
  "name": "String (Required)",
  "description": "String (Max 1000 chars)",
  "price": "Double (Required)",
  "stock": "Integer (Required)",
  "imageUrl": "String (Optional)",
  "category": "String (Required)"
}
```

### Error Handling

- **404 Not Found**: When product with specified ID doesn't exist
- **400 Bad Request**: When request validation fails
- **500 Internal Server Error**: When unexpected server errors occur

### Service Layer Business Rules

1. **Product Creation**: All required fields must be provided
2. **Product Update**: Product must exist before updating
3. **Product Deletion**: Product must exist before deletion
4. **Search Operations**: Case-insensitive partial matching for product names
5. **Category Filtering**: Exact match for category names

---

*This LLD document provides a comprehensive overview of the e-commerce Spring Boot application's ProductManagement module, including detailed architectural diagrams, database design, and business logic flows.*