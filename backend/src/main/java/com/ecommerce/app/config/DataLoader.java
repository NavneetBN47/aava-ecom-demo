package com.ecommerce.app.config;

import com.ecommerce.app.model.Product;
import com.ecommerce.app.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Add sample products if database is empty
        if (productRepository.count() == 0) {
            productRepository.save(new Product(null, "Laptop", "High-performance laptop for professionals", 999.99, 10, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", "Electronics"));
            productRepository.save(new Product(null, "Smartphone", "Latest model with amazing features", 699.99, 15, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", "Electronics"));
            productRepository.save(new Product(null, "Headphones", "Wireless noise-cancelling headphones", 199.99, 20, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", "Electronics"));
            productRepository.save(new Product(null, "Coffee Maker", "Programmable coffee maker", 79.99, 25, "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400", "Home"));
            productRepository.save(new Product(null, "Backpack", "Durable travel backpack", 49.99, 30, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", "Fashion"));
            productRepository.save(new Product(null, "Running Shoes", "Comfortable athletic shoes", 89.99, 18, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "Fashion"));
            productRepository.save(new Product(null, "Desk Lamp", "LED desk lamp with adjustable brightness", 34.99, 22, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "Home"));
            productRepository.save(new Product(null, "Water Bottle", "Insulated stainless steel water bottle", 24.99, 40, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", "Sports"));
            
            System.out.println("Sample products loaded into database!");
        }
    }
}
