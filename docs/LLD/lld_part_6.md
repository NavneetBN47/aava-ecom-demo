## 15. Appendix

### 15.1 Enums

```java
public enum PurchaseType {
    ONE_TIME,
    SUBSCRIPTION
}

public enum CartStatus {
    ACTIVE,
    ABANDONED,
    CHECKED_OUT,
    CLEARED
}

public enum SubscriptionInterval {
    WEEKLY,
    MONTHLY,
    QUARTERLY,
    YEARLY
}
```

### 15.2 Configuration Classes

```java
@Configuration
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
            new ConcurrentMapCache("products"),
            new ConcurrentMapCache("carts")
        ));
        return cacheManager;
    }
}
```

---

**Document Version**: 2.0  
**Last Updated**: 2024-01-15  
**Author**: Engineering Team  
**Status**: Approved for Implementation