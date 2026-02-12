# E-Commerce Spring Boot Application - High Level Design

## System Overview

This document contains the High Level Design (HLD) diagrams for the E-Commerce Spring Boot Application. The system is built using Spring Boot 3.3.0 with Java 21 and PostgreSQL database, following a layered monolith architecture.

### Key Features
- Product catalog management
- Inventory tracking
- Category-based organization
- Search and filtering capabilities
- Full CRUD operations

## Architecture Diagrams

### 1. System Context Diagram

The System Context diagram shows the E-Commerce system and how it fits into the wider environment, including users and external systems.

```mermaid
C4Context
    title System Context Diagram - E-Commerce Application
    
    Person(customer, "Customer", "End user who browses and purchases products")
    Person(admin, "Administrator", "System admin who manages products and inventory")
    
    System(ecommerce, "E-Commerce System", "Spring Boot application providing product catalog, inventory management, and order processing")
    
    System_Ext(payment, "Payment Gateway", "External payment processing system")
    System_Ext(shipping, "Shipping Service", "External shipping and logistics provider")
    System_Ext(email, "Email Service", "External email notification service")
    
    Rel(customer, ecommerce, "Browses products, places orders", "HTTPS")
    Rel(admin, ecommerce, "Manages products and inventory", "HTTPS")
    Rel(ecommerce, payment, "Processes payments", "REST API/HTTPS")
    Rel(ecommerce, shipping, "Arranges shipping", "REST API/HTTPS")
    Rel(ecommerce, email, "Sends notifications", "SMTP")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### 2. Container Diagram

The Container diagram zooms into the E-Commerce system to show the high-level technical building blocks and how they interact.

```mermaid
C4Container
    title Container Diagram - E-Commerce System
    
    Person(customer, "Customer", "End user who browses and purchases products")
    Person(admin, "Administrator", "System admin who manages products and inventory")
    
    Container_Boundary(c1, "E-Commerce System") {
        Container(webapp, "Web Application", "React/Angular SPA", "Provides user interface for product browsing, cart management, and checkout")
        Container(mobileapp, "Mobile Application", "React Native/Flutter", "Mobile interface for product browsing and purchasing")
        Container(api, "API Application", "Spring Boot 3.3.0, Java 21", "Handles business logic, REST API endpoints, authentication, and data processing")
        Container(database, "Database", "PostgreSQL", "Stores product information, inventory data, user accounts, and order history")
    }
    
    System_Ext(payment, "Payment Gateway", "External payment processing")
    System_Ext(email, "Email Service", "External email notifications")
    
    Rel(customer, webapp, "Uses", "HTTPS")
    Rel(customer, mobileapp, "Uses", "HTTPS")
    Rel(admin, webapp, "Manages system", "HTTPS")
    
    Rel(webapp, api, "Makes API calls", "JSON/HTTPS")
    Rel(mobileapp, api, "Makes API calls", "JSON/HTTPS")
    Rel(api, database, "Reads from and writes to", "JDBC/SQL")
    
    Rel(api, payment, "Processes payments", "REST API/HTTPS")
    Rel(api, email, "Sends notifications", "SMTP")
    
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## Data Flow Summary

The system follows these primary data flows:

1. **User Interaction Flow**:
   - User → Web/Mobile App (HTTPS)
   - Web/Mobile App → API (JSON/REST)
   - API → Database (JDBC)
   - Database → API (Result Sets)
   - API → Web/Mobile App (JSON Response)
   - Web/Mobile App → User (HTML/UI)

2. **External Integration Flow**:
   - API → Payment Gateway (REST API/HTTPS)
   - API → Email Service (SMTP)
   - API → Shipping Service (REST API/HTTPS)

## Technology Stack

- **Backend**: Spring Boot 3.3.0, Java 21
- **Database**: PostgreSQL
- **Architecture**: Layered Monolith
- **API**: RESTful services
- **Frontend**: Web and Mobile applications
- **Communication**: HTTPS, JSON, JDBC

## Key Components

### API Application (Spring Boot)
- **Controllers**: Handle REST API endpoints
- **Services**: Implement business logic
- **Repositories**: Data access layer
- **Entities**: JPA entities for database mapping
- **Security**: Authentication and authorization
- **Configuration**: Application configuration and beans

### Database (PostgreSQL)
- **Products Table**: Product catalog information
- **Categories Table**: Product categorization
- **Inventory Table**: Stock levels and tracking
- **Users Table**: Customer and admin accounts
- **Orders Table**: Order history and details

### Client Applications
- **Web Application**: Browser-based interface
- **Mobile Application**: Native mobile interface
- **Admin Panel**: Administrative interface for system management