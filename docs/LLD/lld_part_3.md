## 10. Validation Rules

### 10.1 Inventory Validation

- **Rule:** Requested quantity must not exceed available stock quantity
- **Check Point:** Validate during:
  - Add to cart operation
  - Update cart item quantity operation
- **Error Response:** Return HTTP 400 with message "Requested quantity exceeds available stock"
- **Implementation:** 
  ```java
  public boolean validateInventory(Long productId, Integer requestedQuantity) {
      Product product = productRepository.findById(productId)
          .orElseThrow(() -> new ProductNotFoundException(productId));
      return product.getStockQuantity() >= requestedQuantity;
  }
  ```

### 10.2 Minimum Procurement Threshold Validation

- **Rule:** If product has minimum_procurement_threshold, quantity must meet or exceed this value
- **Check Point:** Validate during add to cart operation
- **Auto-Adjustment:** Automatically set quantity to threshold value if not met
- **Implementation:**
  ```java
  public Integer applyMinimumThreshold(Product product, Integer requestedQuantity) {
      if (product.getMinimumProcurementThreshold() != null) {
          return Math.max(requestedQuantity, product.getMinimumProcurementThreshold());
      }
      return requestedQuantity;
  }
  ```

### 10.3 Cart Item Validation

- **Rule:** Cart item must reference valid product and cart
- **Check Point:** Validate during all cart item operations
- **Error Response:** Return HTTP 404 if cart item, product, or cart not found