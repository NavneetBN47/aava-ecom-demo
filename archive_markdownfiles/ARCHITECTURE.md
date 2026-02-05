# E-Commerce App - Architecture Overview

## Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                     http://localhost:3000                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User interacts
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Home      │  │   Products   │  │     Cart     │         │
│  │  Component   │  │  Component   │  │  Component   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              API Service (api.js)                    │       │
│  │     - getAllProducts()                               │       │
│  │     - getProductById()                               │       │
│  │     - searchProducts()                               │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests (REST API)
                              │ http://localhost:8080/api/products
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │         ProductController (REST API Layer)          │       │
│  │  - GET    /api/products                             │       │
│  │  - GET    /api/products/{id}                        │       │
│  │  - POST   /api/products                             │       │
│  │  - PUT    /api/products/{id}                        │       │
│  │  - DELETE /api/products/{id}                        │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │       ProductService (Business Logic Layer)         │       │
│  │  - getAllProducts()                                 │       │
│  │  - createProduct()                                  │       │
│  │  - updateProduct()                                  │       │
│  │  - deleteProduct()                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │      ProductRepository (Data Access Layer)          │       │
│  │  - findAll()                                        │       │
│  │  - findById()                                       │       │
│  │  - save()                                           │       │
│  │  - delete()                                         │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JPA/Hibernate
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      H2 DATABASE                                │
│                  (In-Memory Database)                           │
│  ┌──────────────────────────────────────────┐                  │
│  │         PRODUCTS TABLE                   │                  │
│  ├──────────────────────────────────────────┤                  │
│  │ ID (Primary Key)                         │                  │
│  │ NAME                                     │                  │
│  │ DESCRIPTION                              │                  │
│  │ PRICE                                    │                  │
│  │ STOCK                                    │                  │
│  │ IMAGE_URL                                │                  │
│  │ CATEGORY                                 │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Client-Side)
- **React 18**: JavaScript library for building user interfaces
- **React Router**: Navigation between pages
- **Axios**: HTTP client for API calls
- **CSS**: Custom styling

### Backend (Server-Side)
- **Spring Boot 3**: Java framework for REST API
- **Spring Data JPA**: Database abstraction layer
- **Maven**: Build and dependency management
- **Lombok**: Reduces boilerplate code

### Database
- **H2**: In-memory SQL database (perfect for development)

---

## Request Flow Example

**Example: User searches for "laptop"**

1. **User Action**: Types "laptop" in search box
2. **React Component**: `Products.js` filters products locally OR calls API
3. **API Call**: `productService.searchProducts("laptop")`
4. **HTTP Request**: `GET http://localhost:8080/api/products/search?name=laptop`
5. **Spring Boot**: `ProductController` receives request
6. **Service Layer**: `ProductService.searchProducts()` is called
7. **Repository**: Queries database with `findByNameContainingIgnoreCase()`
8. **Database**: H2 executes SQL query
9. **Response**: Data flows back through layers
10. **React**: Displays filtered products

---

## Key Concepts

### REST API
The backend exposes a REST API that the frontend consumes:
- **GET**: Retrieve data (Read)
- **POST**: Create new data (Create)
- **PUT**: Update existing data (Update)
- **DELETE**: Remove data (Delete)

### CORS (Cross-Origin Resource Sharing)
Allows the React app (port 3000) to communicate with the Spring Boot API (port 8080).
Configured in `CorsConfig.java`.

### State Management
React's `useState` hook manages the shopping cart in the browser's memory.

### Database
- **In-Memory**: Data exists only while the backend is running
- **Auto-Created**: Tables are automatically created from Java entities
- **Sample Data**: `DataLoader.java` populates initial products

---

## Ports Used

| Service | Port | URL |
|---------|------|-----|
| React Frontend | 3000 | http://localhost:3000 |
| Spring Boot Backend | 8080 | http://localhost:8080 |
| H2 Database Console | 8080 | http://localhost:8080/h2-console |

---

## Data Flow Layers

### 3-Tier Architecture

1. **Presentation Layer** (Frontend)
   - User interface
   - User interactions
   - Display logic

2. **Application Layer** (Backend)
   - Business logic
   - API endpoints
   - Data validation

3. **Data Layer** (Database)
   - Data storage
   - Data retrieval
   - Data persistence

---

## Security Features

Current implementation (for learning):
- CORS enabled for local development
- No authentication (suitable for learning)

For production, you would add:
- User authentication (Spring Security)
- JWT tokens
- HTTPS
- Input validation
- SQL injection prevention (already handled by JPA)
- XSS protection

---

## Scalability Considerations

This app is designed for learning. For production:

**Database:**
- Switch from H2 to PostgreSQL/MySQL
- Add database indexing
- Implement caching (Redis)

**Backend:**
- Add API rate limiting
- Implement pagination
- Add logging and monitoring
- Use connection pooling

**Frontend:**
- Add loading states
- Implement error boundaries
- Use state management library (Redux)
- Add service workers for offline support

---

## Development vs Production

### Current Setup (Development)
- H2 in-memory database (data resets)
- CORS fully open
- No authentication
- Hot-reload enabled
- Detailed error messages

### Production Would Need
- Persistent database (PostgreSQL, MySQL)
- Restricted CORS
- User authentication & authorization
- Environment variables for secrets
- Error handling & logging
- HTTPS
- CDN for static assets
- Load balancing
