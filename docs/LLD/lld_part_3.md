## 10. Validation Rules

### 10.1 Cart Validation Rules

**Quantity Validation:**
- Minimum quantity: 1 (must be positive integer)
- Maximum quantity: Limited by product stock availability
- Quantity cannot exceed available stock_quantity in products table

**Product Availability:**
- Product must exist in products table
- Product stock_quantity must be > 0
- Requested quantity must be ≤ available stock_quantity

**Cart Item Limits:**
- Maximum items per cart: 100 (configurable)
- Duplicate products: Update quantity instead of creating new item
- Session validation: Valid session_id required for all cart operations

**Price Validation:**
- Unit price must match current product price at time of addition
- Subtotal must equal unit_price × quantity
- Total amount must equal sum of all item subtotals

## 11. Error Handling

### 11.1 Cart-Specific Error Scenarios

**Empty Cart Handling:**
- When cart is empty or not found:
  - Return HTTP 200 with message: "Your cart is empty"
  - Return empty items list
  - Total amount: 0.00

**Out of Stock Errors:**
- HTTP 400 Bad Request
- Message: "Product [name] is out of stock"
- Return available stock quantity

**Invalid Quantity Errors:**
- HTTP 400 Bad Request
- Message: "Quantity must be at least 1"
- Or: "Requested quantity exceeds available stock"

**Session Management Errors:**
- HTTP 400 Bad Request
- Message: "Invalid or missing session ID"

**Product Not Found:**
- HTTP 404 Not Found
- Message: "Product with ID [id] not found"

**Cart Item Not Found:**
- HTTP 404 Not Found
- Message: "Cart item with ID [id] not found"

**Cart Limit Exceeded:**
- HTTP 400 Bad Request
- Message: "Cart item limit exceeded (maximum 100 items)"

## 12. Data Models

### 12.1 Cart Entity

```java
@Entity
@Table(name = "cart")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;
    
    @Column(nullable = false, unique = true)
    private String sessionId;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();
    
    // Getters and setters
}
```

### 12.2 CartItem Entity

```java
@Entity
@Table(name = "cart_items")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long cartId;
    
    @Column(nullable = false)
    private Long productId;
    
    @Column(nullable = false)
    private Integer quantity = 1;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", insertable = false, updatable = false)
    private Cart cart;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    
    // Getters and setters
}
```