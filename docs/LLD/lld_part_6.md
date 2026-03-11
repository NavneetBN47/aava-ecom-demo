## 17. Component Architecture

### 17.1 Cart Item Card Component

**Requirement:** Reusable cart item card component with modular design

```java
// Backend Component
@Component
public class CartItemComponent {
    
    @Autowired
    private ProductService productService;
    
    public CartItemDTO buildCartItemCard(CartItem cartItem) {
        Product product = productService.getProductById(cartItem.getProductId());
        
        return CartItemDTO.builder()
            .id(cartItem.getId())
            .productId(product.getId())
            .productName(product.getName())
            .productImage(product.getImageUrl())
            .unitPrice(cartItem.getUnitPrice())
            .quantity(cartItem.getQuantity())
            .subtotal(cartItem.getSubtotal())
            .availableStock(product.getStockQuantity())
            .maxOrderQuantity(product.getMaxOrderQuantity())
            .build();
    }
}
```

```javascript
// Frontend Component (Vue.js)
const CartItemCard = {
    props: {
        item: {
            type: Object,
            required: true
        }
    },
    
    template: `
        <div class="cart-item-card" :data-item-id="item.id">
            <img 
                :src="item.productImage" 
                :alt="item.productName"
                class="cart-item-image"
                loading="lazy" />
            
            <div class="cart-item-details">
                <h3 class="cart-item-name">{{ item.productName }}</h3>
                <p class="cart-item-price">{{ formatPrice(item.unitPrice) }}</p>
                <p class="cart-item-stock" v-if="item.availableStock < 10">
                    Only {{ item.availableStock }} left in stock
                </p>
            </div>
            
            <quantity-selector 
                :quantity="item.quantity"
                :max-quantity="item.maxOrderQuantity"
                :available-stock="item.availableStock"
                @update="updateQuantity" />
            
            <div class="cart-item-subtotal">
                <span class="subtotal-label">Subtotal:</span>
                <span class="subtotal-amount">{{ formatPrice(item.subtotal) }}</span>
            </div>
            
            <button 
                class="remove-button"
                @click="removeItem"
                aria-label="Remove item from cart">
                <icon name="trash" />
                Remove
            </button>
        </div>
    `,
    
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(price);
        },
        
        updateQuantity(newQuantity) {
            this.$emit('update-quantity', {
                itemId: this.item.id,
                quantity: newQuantity
            });
        },
        
        removeItem() {
            this.$emit('remove-item', this.item.id);
        }
    }
};
```

### 17.2 Quantity Selector Component

**Requirement:** Dedicated quantity selector component with validation and accessibility

```javascript
// Quantity Selector Component
const QuantitySelector = {
    props: {
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        maxQuantity: {
            type: Number,
            default: 999
        },
        availableStock: {
            type: Number,
            required: true
        },
        minQuantity: {
            type: Number,
            default: 1
        }
    },
    
    data() {
        return {
            localQuantity: this.quantity,
            isUpdating: false,
            validationError: null
        };
    },
    
    template: `
        <div class="quantity-selector" role="group" aria-label="Quantity selector">
            <button 
                class="quantity-button decrease"
                :disabled="localQuantity <= minQuantity || isUpdating"
                @click="decreaseQuantity"
                aria-label="Decrease quantity">
                <icon name="minus" />
            </button>
            
            <input 
                type="number"
                class="quantity-input"
                v-model.number="localQuantity"
                :min="minQuantity"
                :max="effectiveMaxQuantity"
                @blur="validateAndUpdate"
                @keyup.enter="validateAndUpdate"
                aria-label="Product quantity" />
            
            <button 
                class="quantity-button increase"
                :disabled="localQuantity >= effectiveMaxQuantity || isUpdating"
                @click="increaseQuantity"
                aria-label="Increase quantity">
                <icon name="plus" />
            </button>
            
            <span v-if="validationError" class="quantity-error" role="alert">
                {{ validationError }}
            </span>
            
            <span v-if="isUpdating" class="quantity-loading" aria-live="polite">
                Updating...
            </span>
        </div>
    `,
    
    computed: {
        effectiveMaxQuantity() {
            return Math.min(this.maxQuantity, this.availableStock);
        }
    },
    
    methods: {
        decreaseQuantity() {
            if (this.localQuantity > this.minQuantity) {
                this.localQuantity--;
                this.validateAndUpdate();
            }
        },
        
        increaseQuantity() {
            if (this.localQuantity < this.effectiveMaxQuantity) {
                this.localQuantity++;
                this.validateAndUpdate();
            }
        },
        
        async validateAndUpdate() {
            this.validationError = null;
            
            // Validate quantity
            if (this.localQuantity < this.minQuantity) {
                this.validationError = `Minimum quantity is ${this.minQuantity}`;
                this.localQuantity = this.minQuantity;
                return;
            }
            
            if (this.localQuantity > this.effectiveMaxQuantity) {
                this.validationError = `Maximum available quantity is ${this.effectiveMaxQuantity}`;
                this.localQuantity = this.effectiveMaxQuantity;
                return;
            }
            
            // Update quantity
            if (this.localQuantity !== this.quantity) {
                this.isUpdating = true;
                
                try {
                    await this.$emit('update', this.localQuantity);
                } catch (error) {
                    this.validationError = error.message;
                    this.localQuantity = this.quantity; // Revert on error
                } finally {
                    this.isUpdating = false;
                }
            }
        }
    },
    
    watch: {
        quantity(newValue) {
            this.localQuantity = newValue;
        }
    }
};
```

### 17.3 Cart Summary Component

**Requirement:** Cart summary component for totals and calculations with real-time updates

```javascript
// Cart Summary Component
const CartSummary = {
    props: {
        items: {
            type: Array,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        isCalculating: {
            type: Boolean,
            default: false
        }
    },
    
    template: `
        <div class="cart-summary" role="complementary" aria-label="Cart summary">
            <h2 class="cart-summary-title">Order Summary</h2>
            
            <div class="cart-summary-items">
                <div class="summary-row">
                    <span class="summary-label">Items ({{ itemCount }}):</span>
                    <span class="summary-value">{{ formatPrice(subtotal) }}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Tax (10%):</span>
                    <span class="summary-value">{{ formatPrice(tax) }}</span>
                </div>
                
                <div class="summary-row summary-total">
                    <span class="summary-label">Total:</span>
                    <span class="summary-value" :class="{ 'calculating': isCalculating }">
                        {{ formatPrice(total) }}
                    </span>
                </div>
            </div>
            
            <div class="cart-summary-actions">
                <button 
                    class="checkout-button"
                    :disabled="items.length === 0 || isCalculating"
                    @click="proceedToCheckout"
                    aria-label="Proceed to checkout">
                    Proceed to Checkout
                </button>
                
                <button 
                    class="continue-shopping-button"
                    @click="continueShopping"
                    aria-label="Continue shopping">
                    Continue Shopping
                </button>
            </div>
            
            <div v-if="isCalculating" class="calculation-indicator" aria-live="polite">
                <icon name="spinner" class="spinner" />
                Calculating totals...
            </div>
        </div>
    `,
    
    computed: {
        itemCount() {
            return this.items.reduce((sum, item) => sum + item.quantity, 0);
        }
    },
    
    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(price);
        },
        
        proceedToCheckout() {
            this.$emit('checkout');
        },
        
        continueShopping() {
            this.$emit('continue-shopping');
        }
    }
};
```

### 17.4 Error Notification Component

**Requirement:** Error notification component for cart operations with toast notifications

```javascript
// Error Notification Component
const ErrorNotification = {
    props: {
        error: {
            type: Object,
            default: null
        },
        duration: {
            type: Number,
            default: 5000
        }
    },
    
    data() {
        return {
            isVisible: false,
            timeoutId: null
        };
    },
    
    template: `
        <transition name="toast">
            <div 
                v-if="isVisible && error"
                class="error-notification"
                :class="'error-' + error.type"
                role="alert"
                aria-live="assertive">
                
                <icon :name="getIconName(error.type)" class="error-icon" />
                
                <div class="error-content">
                    <h4 class="error-title">{{ error.title }}</h4>
                    <p class="error-message">{{ error.message }}</p>
                </div>
                
                <button 
                    class="error-close"
                    @click="close"
                    aria-label="Close notification">
                    <icon name="close" />
                </button>
            </div>
        </transition>
    `,
    
    methods: {
        show() {
            this.isVisible = true;
            
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            
            this.timeoutId = setTimeout(() => {
                this.close();
            }, this.duration);
        },
        
        close() {
            this.isVisible = false;
            
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
            
            this.$emit('close');
        },
        
        getIconName(type) {
            const icons = {
                'error': 'alert-circle',
                'warning': 'alert-triangle',
                'info': 'info',
                'success': 'check-circle'
            };
            return icons[type] || 'alert-circle';
        }
    },
    
    watch: {
        error(newError) {
            if (newError) {
                this.show();
            }
        }
    }
};
```

```java
// Backend Error Notification Service
@Service
public class ErrorNotificationService {
    
    public ErrorNotificationDTO createErrorNotification(
            String type, 
            String title, 
            String message) {
        
        return ErrorNotificationDTO.builder()
            .type(type)
            .title(title)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    public ErrorNotificationDTO createInsufficientStockError(String productName, Integer available) {
        return createErrorNotification(
            "error",
            "Insufficient Stock",
            String.format("Only %d units of %s are available", available, productName)
        );
    }
    
    public ErrorNotificationDTO createValidationError(String message) {
        return createErrorNotification(
            "warning",
            "Validation Error",
            message
        );
    }
}
```
