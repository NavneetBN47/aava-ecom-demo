package com.ecommerce.app.repository;

import com.ecommerce.app.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Find products by category
    List<Product> findByCategory(String category);
    
    // Find products by name containing (search)
    List<Product> findByNameContainingIgnoreCase(String name);
    
    // Find products in stock
    List<Product> findByStockGreaterThan(Integer stock);
}
