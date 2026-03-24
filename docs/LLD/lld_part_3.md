## 6. Component Implementation Details

### 6.1 Product Manager Implementation

```python
class ProductManager:
    def __init__(self, repository):
        self.repository = repository
        self.error_handler = ErrorHandlingFramework()
    
    def create_product(self, product_data):
        try:
            # Validate product data
            self._validate_product_data(product_data)
            
            # Generate product ID
            product_id = str(uuid.uuid4())
            product_data['product_id'] = product_id
            product_data['created_at'] = datetime.utcnow()
            
            # Save to database
            self.repository.save(product_data)
            
            return product_data
        except Exception as e:
            return self.error_handler.handleProductError(e)
    
    def get_product(self, product_id):
        try:
            product = self.repository.find_by_id(product_id)
            if not product:
                raise ProductNotFoundException(f"Product {product_id} not found")
            return product
        except Exception as e:
            return self.error_handler.handleProductError(e)
    
    def check_inventory(self, product_id, required_quantity=1):
        try:
            product = self.get_product(product_id)
            return product['stock_quantity'] >= required_quantity
        except Exception as e:
            return self.error_handler.handleInventoryError(e)
    
    def reserve_stock(self, product_id, quantity):
        try:
            product = self.get_product(product_id)
            if product['stock_quantity'] < quantity:
                raise InsufficientStockException()
            
            new_quantity = product['stock_quantity'] - quantity
            self.repository.update(product_id, {'stock_quantity': new_quantity})
            return True
        except Exception as e:
            return self.error_handler.handleInventoryError(e)
```

### 6.2 Cart Manager Implementation

```python
class CartManager:
    def __init__(self, cart_repository, product_manager, discount_engine):
        self.cart_repository = cart_repository
        self.product_manager = product_manager
        self.discount_engine = discount_engine
        self.error_handler = ErrorHandlingFramework()
    
    def get_or_create_cart(self, session_id):
        try:
            cart = self.cart_repository.find_by_session(session_id)
            if not cart:
                cart = self._create_new_cart(session_id)
            return cart
        except Exception as e:
            return self.error_handler.handleCartError(e)
    
    def add_to_cart(self, session_id, product_id, quantity):
        try:
            # Validate inventory
            if not self.product_manager.check_inventory(product_id, quantity):
                raise InsufficientStockException()
            
            # Get or create cart
            cart = self.get_or_create_cart(session_id)
            
            # Get product details
            product = self.product_manager.get_product(product_id)
            
            # Check if item already exists
            existing_item = self._find_cart_item(cart['cart_id'], product_id)
            
            if existing_item:
                new_quantity = existing_item['quantity'] + quantity
                self._update_cart_item(existing_item['item_id'], new_quantity, product['price'])
            else:
                self._add_new_cart_item(cart['cart_id'], product, quantity)
            
            # Recalculate totals
            self.calculate_cart_total(session_id)
            
            return self.get_or_create_cart(session_id)
        except Exception as e:
            return self.error_handler.handleCartError(e)
    
    def calculate_cart_total(self, session_id):
        try:
            cart = self.get_or_create_cart(session_id)
            items = self.cart_repository.get_cart_items(cart['cart_id'])
            
            # Calculate subtotal
            subtotal = sum(item['line_total'] for item in items)
            
            # Apply promotional discounts
            discount = self.discount_engine.applyDiscounts(cart, items)
            
            # Calculate final total
            total = subtotal - discount
            
            # Update cart
            self.cart_repository.update(cart['cart_id'], {
                'subtotal': subtotal,
                'discount': discount,
                'total': total,
                'last_updated': datetime.utcnow()
            })
            
            return {'subtotal': subtotal, 'discount': discount, 'total': total}
        except Exception as e:
            return self.error_handler.handleCartError(e)
```

### 6.3 Promotional Discount Engine Implementation

```python
class PromotionalDiscountEngine:
    def __init__(self):
        self.rules = []
        self._load_discount_rules()
    
    def _load_discount_rules(self):
        # Load active promotional rules
        self.rules = [
            {'type': 'percentage', 'value': 10, 'min_amount': 100, 'code': 'SAVE10'},
            {'type': 'percentage', 'value': 15, 'min_amount': 200, 'code': 'SAVE15'},
            {'type': 'fixed', 'value': 25, 'min_amount': 150, 'code': 'FIXED25'},
            {'type': 'bogo', 'category': 'Electronics', 'code': 'BOGO'}
        ]
    
    def applyDiscounts(self, cart, items):
        best_discount = 0
        
        for rule in self.rules:
            discount = self._calculate_discount_for_rule(rule, cart, items)
            if discount > best_discount:
                best_discount = discount
        
        return best_discount
    
    def _calculate_discount_for_rule(self, rule, cart, items):
        subtotal = sum(item['line_total'] for item in items)
        
        if rule['type'] == 'percentage':
            if subtotal >= rule.get('min_amount', 0):
                return subtotal * (rule['value'] / 100)
        
        elif rule['type'] == 'fixed':
            if subtotal >= rule.get('min_amount', 0):
                return rule['value']
        
        elif rule['type'] == 'bogo':
            # Buy one get one logic
            category_items = [item for item in items if item.get('category') == rule['category']]
            if len(category_items) >= 2:
                cheapest = min(category_items, key=lambda x: x['unit_price'])
                return cheapest['unit_price']
        
        return 0
    
    def validatePromoCode(self, code):
        return any(rule['code'] == code for rule in self.rules)
```

### 6.4 Checkout Preparation Module Implementation

```python
class CheckoutPreparationModule:
    def __init__(self, cart_manager):
        self.cart_manager = cart_manager
        self.error_handler = ErrorHandlingFramework()
    
    def prepareCheckout(self, session_id):
        try:
            # Get cart
            cart = self.cart_manager.get_or_create_cart(session_id)
            
            # Validate inventory
            validation_result = self.validateInventory(cart)
            if not validation_result['valid']:
                raise CheckoutValidationException(validation_result['errors'])
            
            # Reserve items
            self.reserveItems(cart)
            
            # Calculate final total
            final_total = self.calculateFinalTotal(cart)
            
            # Generate order summary
            order_summary = self.generateOrderSummary(cart, final_total)
            
            return {
                'checkout_ready': True,
                'order_summary': order_summary,
                'validation_status': 'passed'
            }
        except Exception as e:
            return self.error_handler.handleCartError(e)
    
    def validateInventory(self, cart):
        items = self.cart_manager.cart_repository.get_cart_items(cart['cart_id'])
        errors = []
        
        for item in items:
            available = self.cart_manager.product_manager.check_inventory(
                item['product_id'], 
                item['quantity']
            )
            if not available:
                errors.append({
                    'product_id': item['product_id'],
                    'product_name': item['product_name'],
                    'error': 'Insufficient stock'
                })
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def reserveItems(self, cart):
        items = self.cart_manager.cart_repository.get_cart_items(cart['cart_id'])
        
        for item in items:
            self.cart_manager.product_manager.reserve_stock(
                item['product_id'],
                item['quantity']
            )
        
        return True
    
    def calculateFinalTotal(self, cart):
        return self.cart_manager.calculate_cart_total(cart['session_id'])
    
    def generateOrderSummary(self, cart, totals):
        items = self.cart_manager.cart_repository.get_cart_items(cart['cart_id'])
        
        return {
            'cart_id': cart['cart_id'],
            'items': items,
            'item_count': len(items),
            'subtotal': totals['subtotal'],
            'discount': totals['discount'],
            'total': totals['total'],
            'items_reserved': True,
            'timestamp': datetime.utcnow().isoformat()
        }
```

### 6.5 Navigation Component Implementation

```javascript
class NavigationComponent {
    constructor() {
        this.currentRoute = '/';
        this.breadcrumb = [];
    }
    
    navigateToProducts() {
        this.currentRoute = '/products';
        this.updateBreadcrumb(['Home', 'Products']);
        this.render();
    }
    
    navigateToCart() {
        this.currentRoute = '/cart';
        this.updateBreadcrumb(['Home', 'Shopping Cart']);
        this.render();
    }
    
    navigateToCheckout() {
        this.currentRoute = '/checkout';
        this.updateBreadcrumb(['Home', 'Shopping Cart', 'Checkout']);
        this.render();
    }
    
    updateBreadcrumb(items) {
        this.breadcrumb = items;
    }
    
    render() {
        // Render navigation UI with accessibility support
        const nav = document.getElementById('main-navigation');
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
        
        // Update active route
        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') === this.currentRoute) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }
}
```

### 6.6 Error Handling Framework Implementation

```python
class ErrorHandlingFramework:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def handleProductError(self, error):
        error_type = type(error).__name__
        
        if isinstance(error, ProductNotFoundException):
            self.logError(error, 'PRODUCT_NOT_FOUND')
            return {
                'error': True,
                'code': 'PRODUCT_NOT_FOUND',
                'message': 'The requested product was not found',
                'user_message': 'Sorry, this product is no longer available'
            }
        
        elif isinstance(error, ValidationException):
            self.logError(error, 'VALIDATION_ERROR')
            return {
                'error': True,
                'code': 'VALIDATION_ERROR',
                'message': str(error),
                'user_message': 'Please check your input and try again'
            }
        
        else:
            self.logError(error, 'PRODUCT_ERROR')
            return {
                'error': True,
                'code': 'PRODUCT_ERROR',
                'message': 'An error occurred while processing the product',
                'user_message': 'Something went wrong. Please try again later'
            }
    
    def handleCartError(self, error):
        if isinstance(error, InsufficientStockException):
            self.logError(error, 'INSUFFICIENT_STOCK')
            return {
                'error': True,
                'code': 'INSUFFICIENT_STOCK',
                'message': 'Not enough stock available',
                'user_message': 'Sorry, we don\'t have enough items in stock'
            }
        
        elif isinstance(error, CheckoutValidationException):
            self.logError(error, 'CHECKOUT_VALIDATION_FAILED')
            return {
                'error': True,
                'code': 'CHECKOUT_VALIDATION_FAILED',
                'message': str(error),
                'user_message': 'Some items in your cart are no longer available'
            }
        
        else:
            self.logError(error, 'CART_ERROR')
            return {
                'error': True,
                'code': 'CART_ERROR',
                'message': 'An error occurred while processing your cart',
                'user_message': 'Something went wrong. Please try again'
            }
    
    def handleInventoryError(self, error):
        self.logError(error, 'INVENTORY_ERROR')
        return {
            'error': True,
            'code': 'INVENTORY_ERROR',
            'message': 'Inventory validation failed',
            'user_message': 'Unable to verify product availability'
        }
    
    def logError(self, error, error_code):
        self.logger.error(f"[{error_code}] {str(error)}", exc_info=True)
    
    def notifyUser(self, message):
        # Send user notification (email, SMS, push notification)
        pass
```

## 7. Accessibility Implementation

### 7.1 WCAG 2.1 Compliance

The system implements accessibility features to ensure WCAG 2.1 Level AA compliance:

#### Keyboard Navigation
```javascript
// Ensure all interactive elements are keyboard accessible
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target;
        if (target.hasAttribute('role') && target.getAttribute('role') === 'button') {
            target.click();
        }
    }
});
```

#### Screen Reader Support
```html
<!-- Product card with ARIA labels -->
<div class="product-card" role="article" aria-labelledby="product-name-123">
    <img src="product.jpg" alt="Product image showing blue wireless headphones">
    <h3 id="product-name-123">Wireless Headphones</h3>
    <p aria-label="Price">$99.99</p>
    <button aria-label="Add Wireless Headphones to cart">Add to Cart</button>
</div>

<!-- Shopping cart with live region -->
<div id="cart-status" role="status" aria-live="polite" aria-atomic="true">
    Cart updated: 3 items, total $299.97
</div>
```

#### Color Contrast
- All text meets minimum contrast ratio of 4.5:1
- Interactive elements have 3:1 contrast ratio
- Focus indicators are clearly visible

#### Form Accessibility
```html
<form aria-labelledby="checkout-form-title">
    <h2 id="checkout-form-title">Checkout Information</h2>
    
    <label for="email">Email Address</label>
    <input 
        type="email" 
        id="email" 
        name="email" 
        required 
        aria-required="true"
        aria-describedby="email-error"
    >
    <span id="email-error" role="alert" aria-live="assertive"></span>
</form>
```
