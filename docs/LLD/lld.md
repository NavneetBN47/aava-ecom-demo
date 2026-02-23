# Low Level Design Document

## 1. Introduction

### 1.1 Purpose
This Low Level Design (LLD) document provides detailed technical specifications for the E-Commerce Platform. It translates the High Level Design into implementable components, defining the internal structure, algorithms, data structures, and interfaces required for development.

### 1.2 Scope
This document covers:
- Detailed component designs
- Class diagrams and data structures
- API specifications
- Database schemas
- Algorithm implementations
- Security implementations
- Error handling mechanisms

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **DTO**: Data Transfer Object
- **ORM**: Object-Relational Mapping
- **JWT**: JSON Web Token
- **CRUD**: Create, Read, Update, Delete
- **REST**: Representational State Transfer

## 2. System Architecture Overview

### 2.1 Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Search Engine**: Elasticsearch
- **File Storage**: AWS S3
- **Authentication**: JWT

### 2.2 Design Patterns
- **MVC Pattern**: Model-View-Controller for application structure
- **Repository Pattern**: Data access abstraction
- **Factory Pattern**: Object creation
- **Singleton Pattern**: Database connections
- **Observer Pattern**: Event handling
- **Strategy Pattern**: Payment processing

## 3. Detailed Component Design

### 3.1 User Management Module

#### 3.1.1 User Model
```javascript
class User {
  constructor() {
    this.id = null;
    this.email = '';
    this.passwordHash = '';
    this.firstName = '';
    this.lastName = '';
    this.phoneNumber = '';
    this.role = 'customer'; // customer, admin, vendor
    this.isActive = true;
    this.emailVerified = false;
    this.createdAt = null;
    this.updatedAt = null;
    this.lastLoginAt = null;
  }
}
```

#### 3.1.2 User Repository
```javascript
class UserRepository {
  async create(userData) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      userData.email,
      userData.passwordHash,
      userData.firstName,
      userData.lastName,
      userData.phoneNumber,
      userData.role
    ];
    return await db.query(query, values);
  }

  async findById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    return await db.query(query, [userId]);
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    return await db.query(query, [email]);
  }

  async update(userId, userData) {
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, phone_number = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const values = [userData.firstName, userData.lastName, userData.phoneNumber, userId];
    return await db.query(query, values);
  }

  async delete(userId) {
    const query = 'UPDATE users SET is_active = false WHERE id = $1';
    return await db.query(query, [userId]);
  }
}
```

#### 3.1.3 Authentication Service
```javascript
class AuthenticationService {
  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET;
    this.tokenExpiry = '24h';
  }

  async register(userData) {
    // Validate input
    this.validateRegistrationData(userData);
    
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // Create user
    const user = await this.userRepository.create({
      ...userData,
      passwordHash
    });

    // Generate verification token
    const verificationToken = this.generateVerificationToken(user.id);
    
    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  async login(email, password) {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry }
    );

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return { user, token };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  validateRegistrationData(userData) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Additional validation rules
  }
}
```

### 3.2 Product Catalog Module

#### 3.2.1 Product Model
```javascript
class Product {
  constructor() {
    this.id = null;
    this.name = '';
    this.description = '';
    this.sku = '';
    this.categoryId = null;
    this.brandId = null;
    this.price = 0;
    this.compareAtPrice = 0;
    this.costPrice = 0;
    this.quantity = 0;
    this.weight = 0;
    this.dimensions = {
      length: 0,
      width: 0,
      height: 0
    };
    this.images = [];
    this.attributes = {};
    this.isActive = true;
    this.isFeatured = false;
    this.createdAt = null;
    this.updatedAt = null;
  }
}
```