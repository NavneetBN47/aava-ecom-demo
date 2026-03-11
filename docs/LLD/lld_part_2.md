## 9. Database Schema

### 9.1 Shopping Cart Table

```sql
CREATE TABLE shopping_cart (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_subscription BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_cart_customer ON shopping_cart(customer_id);
CREATE INDEX idx_cart_product ON shopping_cart(product_id);
```

---

## 10. Technology Stack

- **Framework:** Spring Boot 3.x
- **Language:** Java 21
- **Database:** PostgreSQL 15+
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven / Gradle
- **API Documentation:** SpringDoc OpenAPI
- **Validation:** Jakarta Bean Validation
- **Logging:** SLF4J with Logback

---

## 11. Design Patterns Used

1. **Repository Pattern:** Data access abstraction through Spring Data JPA repositories
2. **Service Layer Pattern:** Business logic encapsulation in service classes
3. **DTO Pattern:** Data transfer between layers using DTOs
4. **Dependency Injection:** Spring's IoC container for loose coupling
5. **Builder Pattern:** For complex object creation (optional)

---

## 12. Key Features

- RESTful API design following best practices
- Comprehensive input validation
- Transaction management for data consistency
- Exception handling with meaningful error messages
- Audit fields (created_at, updated_at) for tracking
- Database indexing for performance optimization
- Shopping cart management with inventory validation
- Minimum procurement threshold enforcement
- Support for subscription-based purchases
- Cart total calculation

---

## 13. Future Enhancements

- Implement pagination for product listing
- Add search and filtering capabilities
- Implement caching for frequently accessed products
- Add product image management
- Implement soft delete for products
- Add user authentication and authorization
- Implement order processing from cart
- Add discount and promotion management
- Implement cart expiration logic
- Add wishlist functionality

---

**Document Version:** 2.0  
**Last Updated:** 2024-01-15  
**Author:** Engineering Team