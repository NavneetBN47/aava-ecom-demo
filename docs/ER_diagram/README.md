# Database ER Diagram

This directory contains the Entity-Relationship diagram for the e-commerce application database.

## Files

- `ecommerce_er_diagram.mmd` - Mermaid ER diagram source code

## Entities

- **PRODUCT**: Main product entity with attributes like name, price, stock quantity
- **CATEGORY**: Product categories for organization
- **PRODUCT_IMAGE**: Images associated with products

## Relationships

- One category can contain many products
- One product can have many images

## Usage

To view the diagram, you can:
1. Copy the content of the .mmd file to [Mermaid Live Editor](https://mermaid.live/)
2. Use any Mermaid-compatible viewer or IDE extension
