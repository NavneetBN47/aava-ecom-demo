# Complete Readme File


## 1. Prerequisites

### 1. Java Development Kit (JDK) 17 or higher 
## (BUT NOT JDK 25 - WILL NOT WORK WITH SPRINGBOOT)

**Check if Java is installed:**
```bash
java -version
```

**If not installed, download from:**
- https://www.oracle.com/java/technologies/downloads/#java21
- Or use Homebrew: `brew install openjdk@21`

### 2. Maven (Build tool for Spring Boot)

**Check if Maven is installed:**
```bash
mvn -version
```

**If not installed:**
```bash
brew install maven
```

### 3. Node.js and npm (for React)

**Check if Node.js is installed:**
```bash
node -v
npm -v
```
---

## Essential Commands: SETUP
1. unzip folder
2. open terminal
3. navigate to project directory


### First Time Setup
```bash
# Backend
cd backend

# if you want to force using JDK21 (ie if you have multiple JDK versions and are running into errors), run this command:
# export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home

mvn clean install

# Frontend
cd .. 
cd frontend
npm install ajv@8.12.0 --legacy-peer-deps
npm install --legacy-peer-deps
```

### Starting the App (Every Time)
```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run
# Wait for: "Started EcommerceApplication"

# Open a NEW terminal

# Terminal 2 - Frontend
cd frontend
npm start
# Wait for: "Compiled successfully"
```

## Stopping the Application

### To stop the backend:
- Go to the terminal running the backend
- Press `Ctrl + C`

### To stop the frontend:
- Go to the terminal running the frontend
- Press `Ctrl + C`

---


## Important URLs

| What | URL |
|------|-----|
| **Frontend App** | http://localhost:3000 |
| **Backend API** | http://localhost:8080/api/products |
| **H2 Database Console** | http://localhost:8080/h2-console |

### H2 Database Login
- **JDBC URL:** `jdbc:h2:mem:ecommercedb`
- **Username:** `sa`
- **Password:** (empty)

---

## Project Structure

```
ecommerce-app/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/ecommerce/app/
│   │   ├── EcommerceApplication.java    # Main application
│   │   ├── controller/
│   │   │   └── ProductController.java   # REST API endpoints
│   │   ├── model/
│   │   │   └── Product.java             # Product entity
│   │   ├── repository/
│   │   │   └── ProductRepository.java   # Database operations
│   │   ├── service/
│   │   │   └── ProductService.java      # Business logic
│   │   └── config/
│   │       ├── CorsConfig.java          # CORS configuration
│   │       └── DataLoader.java          # Sample data
│   ├── src/main/resources/
│   │   └── application.properties       # Configuration
│   └── pom.xml                          # Maven dependencies
│
└── frontend/                         # React Frontend
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js & .css        # Navigation bar
    │   │   ├── Home.js & .css          # Home page
    │   │   ├── Products.js & .css      # Products page
    │   │   ├── ProductCard.js & .css   # Product card
    │   │   └── Cart.js & .css          # Shopping cart
    │   ├── services/
    │   │   └── api.js                  # Backend API calls
    │   ├── App.js                      # Main app component
    │   ├── index.js                    # Entry point
    │   └── App.css
    └── package.json                    # npm dependencies
```
---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/{id} | Get one product |
| POST | /api/products | Create product |
| PUT | /api/products/{id} | Update product |
| DELETE | /api/products/{id} | Delete product |
| GET | /api/products/category/{cat} | Filter by category |
| GET | /api/products/search?name=X | Search products |

---

## Quick Fixes

### Backend won't start
```bash
cd backend
rm -rf target
mvn clean install
mvn spring-boot:run
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install ajv@8.12.0 --legacy-peer-deps
npm install --legacy-peer-deps
npm start
```

### Port already in use (Mac)
```bash
# Find process on port 8080
lsof -i :8080
# Kill it (replace XXXX with PID)
kill -9 XXXX
```

### Port already in use (Windows)
```cmd
netstat -ano | findstr :8080
taskkill /PID XXXX /F
```

---

## File Locations

### To add sample products:
`backend/src/main/java/com/ecommerce/app/config/DataLoader.java`

### To change backend port:
`backend/src/main/resources/application.properties`

### To change API URL:
`frontend/src/services/api.js`

### To modify pages:
- Home: `frontend/src/components/Home.js`
- Products: `frontend/src/components/Products.js`
- Cart: `frontend/src/components/Cart.js`

---

## Tech Stack

### Backend
- **Language:** Java 17
- **Framework:** Spring Boot 3
- **Build Tool:** Maven
- **Database:** H2 (in-memory)

### Frontend
- **Language:** JavaScript
- **Library:** React 18
- **Routing:** React Router
- **HTTP Client:** Axios

---





## Troubleshooting

### Problem: "Port 8080 is already in use"

**Solution**: Another application is using port 8080
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process (replace PID with the number shown)
kill -9 PID
```

Or change the port in `backend/src/main/resources/application.properties`:
```properties
server.port=8081
```
Then update the frontend API URL in `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8081/api';
```

---

### Problem: "Port 3000 is already in use"

**Solution**: React's port is in use
- Press `Y` when asked if you want to run on another port
- Or kill the process on port 3000

---

### Problem: "Failed to load products"

**Solutions:**
1. Make sure the backend is running (check terminal for errors)
2. Check that backend is at http://localhost:8080
3. Try accessing http://localhost:8080/api/products directly in browser
4. Check browser console for errors (F12 > Console tab)

---

### Problem: "mvn: command not found"

**Solution**: Maven is not installed or not in PATH
```bash
# Install with Homebrew
brew install maven

# Or download from https://maven.apache.org/download.cgi
```

---

### Problem: "npm: command not found"

**Solution**: Node.js/npm is not installed
```bash
# Install with Homebrew
brew install node

# Or download from https://nodejs.org/
```

---

### Problem: Backend won't start - Java errors

**Check Java version:**
```bash
java -version
```

You need Java 21 (not 25). If you have an older version:
```bash
brew install openjdk@21
```

---

### Problem: SSL Certificate issue:

```bash

cd frontend
npm config set strict-ssl false
npm install
```