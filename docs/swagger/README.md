# API Documentation

## E-commerce Product Management API

This directory contains the OpenAPI 3.0.3 specification for the E-commerce Product Management API.

### Files

- `api/ecommerce_swagger.json` - Complete OpenAPI specification in JSON format

### API Overview

The API provides endpoints for:

- **Product CRUD Operations**: Create, read, update, and delete products
- **Product Search**: Search products by name or description
- **Category Filtering**: Filter products by category

### Base URL

- Development: `http://localhost:8080`

### Authentication

Currently, the API does not require authentication. This may change in future versions.

### Response Format

All responses are in JSON format. Error responses follow a consistent structure with error type, message, and timestamp.

### Validation

The API includes comprehensive input validation:
- Product names: 1-100 characters
- Descriptions: 1-500 characters
- Prices: Must be non-negative
- Stock quantities: Must be non-negative integers
- Categories: 1-50 characters

### Usage

You can use this specification with various tools:
- Import into Postman for API testing
- Generate client SDKs using OpenAPI Generator
- Use with Swagger UI for interactive documentation
- Integrate with API testing frameworks
