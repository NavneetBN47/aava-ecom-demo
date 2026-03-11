## 22. Enhanced Error Handling and Recovery

### 22.1 Comprehensive Error Handling Strategy

**Requirement:** Implement comprehensive error handling and recovery mechanisms with user notifications

```java
@Service
public class ErrorHandlingService {
    
    @Autowired
    private ErrorNotificationService notificationService;
    
    @Autowired
    private ErrorLogRepository errorLogRepository;
    
    /**
     * Handle cart operation errors with recovery
     */
    public <T> T handleCartOperation(
            Supplier<T> operation,
            String operationName,
            Long userId) {
        
        int maxRetries = 3;
        int retryCount = 0;
        Exception lastException = null;
        
        while (retryCount < maxRetries) {
            try {
                return operation.get();
            } catch (OptimisticLockException e) {
                // Retry on concurrent modification
                retryCount++;
                lastException = e;
                log.warn("Optimistic lock exception on {}, retry {}/{}", 
                    operationName, retryCount, maxRetries);
                
                try {
                    Thread.sleep(100 * retryCount); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } catch (InsufficientStockException e) {
                // No retry for business logic errors
                logError(operationName, userId, e);
                throw e;
            } catch (Exception e) {
                // Retry on transient errors
                if (isTransientError(e) && retryCount < maxRetries - 1) {
                    retryCount++;
                    lastException = e;
                    log.warn("Transient error on {}, retry {}/{}", 
                        operationName, retryCount, maxRetries);
                } else {
                    logError(operationName, userId, e);
                    throw new CartOperationException(
                        "Failed to execute " + operationName, e);
                }
            }
        }
        
        logError(operationName, userId, lastException);
        throw new CartOperationException(
            "Failed to execute " + operationName + " after " + maxRetries + " retries",
            lastException);
    }
    
    private boolean isTransientError(Exception e) {
        return e instanceof DataAccessException ||
               e instanceof TimeoutException ||
               e.getCause() instanceof SQLException;
    }
    
    private void logError(String operation, Long userId, Exception e) {
        ErrorLog errorLog = ErrorLog.builder()
            .operation(operation)
            .userId(userId)
            .errorType(e.getClass().getSimpleName())
            .errorMessage(e.getMessage())
            .stackTrace(getStackTraceAsString(e))
            .timestamp(LocalDateTime.now())
            .build();
        
        errorLogRepository.save(errorLog);
    }
    
    private String getStackTraceAsString(Exception e) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }
}
```

### 22.2 Frontend Error Recovery

```javascript
// Error Recovery Service
class ErrorRecoveryService {
    constructor() {
        this.errorQueue = [];
        this.isRecovering = false;
    }
    
    async handleError(error, context) {
        console.error('Error occurred:', error, 'Context:', context);
        
        // Categorize error
        const errorType = this.categorizeError(error);
        
        switch (errorType) {
            case 'NETWORK':
                return await this.handleNetworkError(error, context);
            
            case 'VALIDATION':
                return await this.handleValidationError(error, context);
            
            case 'BUSINESS_LOGIC':
                return await this.handleBusinessLogicError(error, context);
            
            case 'SERVER':
                return await this.handleServerError(error, context);
            
            default:
                return await this.handleUnknownError(error, context);
        }
    }
    
    categorizeError(error) {
        if (!navigator.onLine || error.message.includes('Network')) {
            return 'NETWORK';
        }
        
        if (error.response) {
            const status = error.response.status;
            
            if (status === 400) return 'VALIDATION';
            if (status === 409) return 'BUSINESS_LOGIC';
            if (status >= 500) return 'SERVER';
        }
        
        return 'UNKNOWN';
    }
    
    async handleNetworkError(error, context) {
        // Queue operation for retry when network is restored
        this.errorQueue.push({ error, context, timestamp: Date.now() });
        
        // Show offline notification
        store.dispatch('notifications/show', {
            type: 'warning',
            title: 'Connection Lost',
            message: 'Your changes will be saved when connection is restored',
            persistent: true
        });
        
        // Listen for network restoration
        window.addEventListener('online', () => this.retryQueuedOperations());
        
        return { recovered: false, queued: true };
    }
    
    async handleValidationError(error, context) {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        
        store.dispatch('notifications/show', {
            type: 'error',
            title: 'Validation Error',
            message: errorMessage
        });
        
        return { recovered: false, userAction: 'fix_input' };
    }
    
    async handleBusinessLogicError(error, context) {
        const errorMessage = error.response?.data?.message;
        
        if (errorMessage.includes('Insufficient stock')) {
            // Refresh cart to get updated stock
            await store.dispatch('cart/fetchCart', context.userId);
            
            store.dispatch('notifications/show', {
                type: 'warning',
                title: 'Stock Updated',
                message: 'Product availability has changed. Cart updated.'
            });
            
            return { recovered: true, action: 'cart_refreshed' };
        }
        
        return { recovered: false, userAction: 'retry' };
    }
    
    async handleServerError(error, context) {
        // Retry with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            await this.delay(Math.pow(2, retryCount) * 1000);
            
            try {
                // Retry the operation
                const result = await context.retryFunction();
                
                store.dispatch('notifications/show', {
                    type: 'success',
                    title: 'Operation Successful',
                    message: 'Your request has been processed'
                });
                
                return { recovered: true, result };
            } catch (retryError) {
                retryCount++;
                
                if (retryCount === maxRetries) {
                    store.dispatch('notifications/show', {
                        type: 'error',
                        title: 'Operation Failed',
                        message: 'Please try again later or contact support'
                    });
                    
                    return { recovered: false, maxRetriesReached: true };
                }
            }
        }
    }
    
    async handleUnknownError(error, context) {
        // Log to error tracking service
        this.logToErrorTracking(error, context);
        
        store.dispatch('notifications/show', {
            type: 'error',
            title: 'Unexpected Error',
            message: 'Something went wrong. Please try again.'
        });
        
        return { recovered: false, logged: true };
    }
    
    async retryQueuedOperations() {
        if (this.isRecovering) return;
        
        this.isRecovering = true;
        
        const queue = [...this.errorQueue];
        this.errorQueue = [];
        
        for (const item of queue) {
            try {
                await item.context.retryFunction();
            } catch (error) {
                // Re-queue if still failing
                this.errorQueue.push(item);
            }
        }
        
        if (this.errorQueue.length === 0) {
            store.dispatch('notifications/show', {
                type: 'success',
                title: 'Connection Restored',
                message: 'All pending changes have been saved'
            });
        }
        
        this.isRecovering = false;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    logToErrorTracking(error, context) {
        // Integration with error tracking service (e.g., Sentry)
        if (window.Sentry) {
            Sentry.captureException(error, {
                contexts: {
                    cart: context
                }
            });
        }
    }
}

// Global error handler
const errorRecovery = new ErrorRecoveryService();

// Vue error handler
Vue.config.errorHandler = (err, vm, info) => {
    errorRecovery.handleError(err, {
        component: vm.$options.name,
        info: info
    });
};

// Axios error interceptor
axios.interceptors.response.use(
    response => response,
    error => {
        const context = {
            url: error.config.url,
            method: error.config.method,
            retryFunction: () => axios.request(error.config)
        };
        
        return errorRecovery.handleError(error, context);
    }
);
```
