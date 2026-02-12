# E-Commerce System - High Level Design

This document contains the high-level design diagrams for the E-Commerce Spring Boot Application.

## System Overview

- **Name**: E-Commerce Spring Boot Application
- **Tech Stack**: Spring Boot 3.3.0, PostgreSQL, Java 21
- **Architecture**: Three-Tier Layered Architecture (Controller-Service-Repository)

## C4 System Context Diagram

The following diagram shows the system context and how users interact with the E-Commerce system.

```mermaid
C4Context
    title System Context Diagram for E-Commerce Application
    
    Person(customer, "Customer", "A customer who browses and purchases products")
    Person(admin, "Admin User", "Administrator who manages products and orders")
    
    System(ecommerce, "E-Commerce System", "Allows customers to browse products, place orders, and manage their accounts")
    
    System_Ext(payment, "Payment Gateway", "External payment processing system")
    System_Ext(shipping, "Shipping Service", "External shipping and logistics provider")
    System_Ext(email, "Email Service", "External email notification service")
    
    Rel(customer, ecommerce, "Browses products, places orders", "HTTPS")
    Rel(admin, ecommerce, "Manages products and orders", "HTTPS")
    Rel(ecommerce, payment, "Processes payments", "HTTPS/REST")
    Rel(ecommerce, shipping, "Manages shipping", "HTTPS/REST")
    Rel(ecommerce, email, "Sends notifications", "SMTP")
    
    UpdateElementStyle(customer, $fontColor="#000000", $bgColor="#87CEEB")
    UpdateElementStyle(admin, $fontColor="#000000", $bgColor="#87CEEB")
    UpdateElementStyle(ecommerce, $fontColor="#ffffff", $bgColor="#1168bd")
```

## C4 Container Diagram

The following diagram shows the containers within the E-Commerce system and their interactions.

```mermaid
C4Container
    title Container Diagram for E-Commerce System
    
    Person(customer, "Customer", "A customer who browses and purchases products")
    Person(admin, "Admin User", "Administrator who manages products and orders")
    
    System_Boundary(c1, "E-Commerce System") {
        Container(webapp, "Web Application", "React/Angular SPA", "Provides the user interface for customers and admins")
        Container(api, "API Application", "Spring Boot 3.3.0, Java 21", "Handles REST APIs, business logic, and CRUD operations")
        Container(db, "Database", "PostgreSQL", "Stores product inventory, user data, and order information")
    }
    
    System_Ext(payment, "Payment Gateway", "External payment processing system")
    System_Ext(shipping, "Shipping Service", "External shipping and logistics provider")
    System_Ext(email, "Email Service", "External email notification service")
    
    Rel(customer, webapp, "Uses", "HTTPS")
    Rel(admin, webapp, "Uses", "HTTPS")
    Rel(webapp, api, "Makes API calls to", "JSON/REST over HTTP")
    Rel(api, db, "Reads from and writes to", "JDBC")
    Rel(api, payment, "Processes payments via", "HTTPS/REST")
    Rel(api, shipping, "Manages shipping via", "HTTPS/REST")
    Rel(api, email, "Sends notifications via", "SMTP")
    
    UpdateElementStyle(customer, $fontColor="#000000", $bgColor="#87CEEB")
    UpdateElementStyle(admin, $fontColor="#000000", $bgColor="#87CEEB")
    UpdateElementStyle(webapp, $fontColor="#ffffff", $bgColor="#85BBF0")
    UpdateElementStyle(api, $fontColor="#ffffff", $bgColor="#85BBF0")
    UpdateElementStyle(db, $fontColor="#ffffff", $bgColor="#85BBF0")
```

## Architecture Details

### Components Description

1. **API Application (Spring Boot Service)**
   - Handles REST APIs
   - Implements business logic
   - Performs CRUD operations
   - Built with Spring Boot 3.3.0 and Java 21

2. **Database (PostgreSQL)**
   - Stores product inventory and metadata
   - Manages user accounts and authentication data
   - Handles order and transaction records

3. **Client Applications (Web Application)**
   - Provides user interface for customers and administrators
   - Consumes REST APIs from the backend
   - Handles user interactions and data presentation

### Data Flow Summary

- **User ↔ Web App**: HTTPS communication for secure user interactions
- **Web App ↔ API**: JSON/REST over HTTP for data exchange
- **API ↔ Database**: JDBC for database operations and data persistence

### Technology Stack

- **Backend**: Spring Boot 3.3.0, Java 21
- **Database**: PostgreSQL
- **Architecture Pattern**: Three-Tier Layered Architecture (Controller-Service-Repository)
- **Communication**: REST APIs, HTTPS, JDBC