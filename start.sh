#!/bin/bash

# E-Commerce App - Quick Start Script for Mac
# This script helps you set up and run the application

echo "======================================"
echo "E-Commerce App - Setup & Start"
echo "======================================"
echo ""

# Check if Java is installed
echo "Checking Java installation..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo "✓ Java is installed: $JAVA_VERSION"
else
    echo "✗ Java is NOT installed"
    echo "Please install Java 17 or higher from:"
    echo "https://www.oracle.com/java/technologies/downloads/"
    echo "Or run: brew install openjdk@17"
    exit 1
fi

# Check if Maven is installed
echo "Checking Maven installation..."
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -version | head -n 1)
    echo "✓ Maven is installed: $MVN_VERSION"
else
    echo "✗ Maven is NOT installed"
    echo "Please install Maven:"
    echo "Run: brew install maven"
    exit 1
fi

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✓ Node.js is installed: $NODE_VERSION"
else
    echo "✗ Node.js is NOT installed"
    echo "Please install Node.js from:"
    echo "https://nodejs.org/"
    echo "Or run: brew install node"
    exit 1
fi

# Check if npm is installed
echo "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✓ npm is installed: $NPM_VERSION"
else
    echo "✗ npm is NOT installed (should come with Node.js)"
    exit 1
fi

echo ""
echo "======================================"
echo "All prerequisites are installed! ✓"
echo "======================================"
echo ""

# Ask if user wants to install dependencies
read -p "Do you want to install project dependencies? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Installing backend dependencies..."
    cd backend
    mvn clean install
    cd ..
    
    echo ""
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    echo ""
    echo "✓ Dependencies installed successfully!"
fi

echo ""
echo "======================================"
echo "How to run the application:"
echo "======================================"
echo ""
echo "1. Start Backend (in one terminal):"
echo "   cd backend"
echo "   mvn spring-boot:run"
echo ""
echo "2. Start Frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open browser to: http://localhost:3000"
echo ""
echo "Press any key to continue..."
read -n 1 -s

# Ask if user wants to start the application now
echo ""
read -p "Do you want to start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting backend server..."
    echo "Backend will run at: http://localhost:8080"
    echo ""
    
    # Start backend in background
    cd backend
    mvn spring-boot:run &
    BACKEND_PID=$!
    cd ..
    
    echo "Waiting for backend to start..."
    sleep 10
    
    echo ""
    echo "Starting frontend server..."
    echo "Frontend will run at: http://localhost:3000"
    echo ""
    
    # Start frontend
    cd frontend
    npm start
fi
