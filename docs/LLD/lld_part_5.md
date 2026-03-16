## 19. Deployment Considerations

### 19.1 Environment Configuration
```yaml
# application.yml
spring:
  profiles:
    active: ${ENVIRONMENT:dev}
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

server:
  port: ${SERVER_PORT:8080}
  
logging:
  level:
    com.ecommerce: ${LOG_LEVEL:INFO}
```

### 19.2 Health Checks
```java
@RestController
@RequestMapping("/actuator")
public class HealthController {
    
    @Autowired
    private DataSource dataSource;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("database", checkDatabase());
        return ResponseEntity.ok(health);
    }
    
    private String checkDatabase() {
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(1) ? "UP" : "DOWN";
        } catch (Exception e) {
            return "DOWN";
        }
    }
}
```

### 19.3 Containerization
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/ecommerce-platform.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Appendix A: API Response Examples

### Get Product Response
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stockQuantity": 50,
  "category": "Electronics",
  "imageUrl": "https://example.com/laptop.jpg",
  "minimumOrderQuantity": 1,
  "isSubscriptionEligible": true,
  "subscriptionPrice": 89.99,
  "currentStockAvailability": true,
  "subscriptionOptions": {
    "monthly": 89.99,
    "annual": 899.99
  },
  "isAddableToCart": true
}
```

### Get Cart Response
```json
{
  "id": 1,
  "userId": 123,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Laptop",
        "price": 999.99
      },
      "quantity": 2,
      "subtotal": 1999.98
    }
  ],
  "totalAmount": 1999.98,
  "totalItems": 1
}
```

---

## Appendix B: Database Migration Scripts

### Initial Schema
```sql
-- V1__initial_schema.sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    minimum_order_quantity INTEGER DEFAULT 1,
    is_subscription_eligible BOOLEAN DEFAULT false,
    subscription_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

**End of Document**