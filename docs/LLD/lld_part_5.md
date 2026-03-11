## 16. Responsive Design

### 16.1 Mobile Optimization

**Requirement:** Responsive design for mobile devices (320px - 767px)

**Implementation Strategy:**
- Stacked cart items layout
- Touch-friendly buttons (minimum 44x44px)
- Simplified cart summary
- Bottom-fixed checkout button
- Swipe gestures for item removal

```css
/* Mobile Cart Styles */
@media (max-width: 767px) {
    .cart-container {
        padding: 16px;
    }
    
    .cart-item {
        display: flex;
        flex-direction: column;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
    }
    
    .cart-item-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 4px;
    }
    
    .cart-item-details {
        margin-top: 12px;
    }
    
    .quantity-selector {
        display: flex;
        justify-content: center;
        margin: 16px 0;
    }
    
    .quantity-button {
        min-width: 44px;
        min-height: 44px;
        font-size: 20px;
        touch-action: manipulation;
    }
    
    .cart-summary {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 16px;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }
    
    .checkout-button {
        width: 100%;
        min-height: 48px;
        font-size: 18px;
        touch-action: manipulation;
    }
}
```

```javascript
// Mobile Touch Gestures
class MobileCartInteractions {
    initializeSwipeGestures() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach(item => {
            let startX = 0;
            let currentX = 0;
            
            item.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });
            
            item.addEventListener('touchmove', (e) => {
                currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                
                if (diff > 100) {
                    // Swipe left - show delete button
                    item.classList.add('swipe-left');
                }
            });
            
            item.addEventListener('touchend', () => {
                if (item.classList.contains('swipe-left')) {
                    // Show confirmation
                    this.showDeleteConfirmation(item);
                }
            });
        });
    }
}
```

### 16.2 Tablet Optimization

**Requirement:** Responsive design for tablet devices (768px - 1023px)

**Implementation Strategy:**
- Two-column layout for cart items
- Optimized cart summary sidebar
- Touch-optimized controls
- Landscape and portrait support

```css
/* Tablet Cart Styles */
@media (min-width: 768px) and (max-width: 1023px) {
    .cart-container {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 24px;
        padding: 24px;
    }
    
    .cart-items-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    .cart-item {
        display: flex;
        flex-direction: column;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
    }
    
    .cart-summary {
        position: sticky;
        top: 24px;
        height: fit-content;
        padding: 24px;
        background: #f5f5f5;
        border-radius: 8px;
    }
    
    /* Portrait mode adjustment */
    @media (orientation: portrait) {
        .cart-container {
            grid-template-columns: 1fr;
        }
        
        .cart-summary {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 0;
        }
    }
}
```

### 16.3 Desktop Optimization

**Requirement:** Responsive design for desktop devices (1024px+)

**Implementation Strategy:**
- Side-by-side layout with cart items and summary
- Full cart details display
- Hover interactions
- Optimized for mouse and keyboard

```css
/* Desktop Cart Styles */
@media (min-width: 1024px) {
    .cart-container {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 32px;
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px;
    }
    
    .cart-items-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .cart-item {
        display: grid;
        grid-template-columns: 120px 1fr auto auto;
        gap: 24px;
        align-items: center;
        padding: 24px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        transition: box-shadow 0.3s ease;
    }
    
    .cart-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .cart-item-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
    }
    
    .cart-summary {
        position: sticky;
        top: 32px;
        height: fit-content;
        padding: 32px;
        background: #f5f5f5;
        border-radius: 12px;
    }
    
    .quantity-selector {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .quantity-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }
    
    .quantity-button:hover {
        background-color: #e0e0e0;
    }
}
```

### 16.4 Responsive Images

```html
<!-- Responsive Product Images -->
<picture>
    <source 
        media="(max-width: 767px)" 
        srcset="product-mobile.jpg 1x, product-mobile@2x.jpg 2x">
    <source 
        media="(min-width: 768px) and (max-width: 1023px)" 
        srcset="product-tablet.jpg 1x, product-tablet@2x.jpg 2x">
    <source 
        media="(min-width: 1024px)" 
        srcset="product-desktop.jpg 1x, product-desktop@2x.jpg 2x">
    <img 
        src="product-desktop.jpg" 
        alt="Product Name"
        loading="lazy">
</picture>
```
