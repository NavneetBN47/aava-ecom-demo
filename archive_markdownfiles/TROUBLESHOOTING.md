# Troubleshooting Guide

## Quick Diagnostic Checklist

Run through this checklist when something isn't working:

- [ ] Are both terminal windows open and running?
- [ ] Did the backend finish starting? (Look for "Started EcommerceApplication")
- [ ] Did the frontend finish compiling? (Look for "Compiled successfully")
- [ ] Is your browser at http://localhost:3000?
- [ ] Are there any red error messages in the terminals?

---

## Common Issues and Solutions

### Issue 1: "Port 8080 is already in use"

**What it means:** Another program is using port 8080.

**How to fix (Mac):**
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process (replace XXXX with the PID number shown)
kill -9 XXXX
```

**How to fix (Windows):**
```cmd
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace XXXX with the PID number shown)
taskkill /PID XXXX /F
```

**Alternative:** Change the port in `application.properties`:
```properties
server.port=8081
```
Then update `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8081/api';
```

---

### Issue 2: "Port 3000 is already in use"

**What it means:** React's default port is in use.

**How to fix:**
When prompted "Would you like to run the app on another port instead?", type `Y` and press Enter.

**Or kill the process:**
```bash
# Mac
lsof -i :3000
kill -9 XXXX

# Windows
netstat -ano | findstr :3000
taskkill /PID XXXX /F
```

---

### Issue 3: "Failed to load products" or "Network Error"

**Possible causes:**
1. Backend server isn't running
2. Backend crashed
3. Wrong API URL
4. CORS issue

**How to diagnose:**

**Step 1:** Check if backend is running
- Look at backend terminal for errors
- Try opening http://localhost:8080/api/products in your browser
- You should see a JSON array of products

**Step 2:** Check browser console
- Press F12 in your browser
- Click "Console" tab
- Look for red error messages

**Step 3:** Check for CORS errors
If you see "CORS policy" error:
- Make sure `CorsConfig.java` exists
- Restart the backend server

**Step 4:** Verify API URL
In `frontend/src/services/api.js`, make sure:
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

---

### Issue 4: "mvn: command not found"

**What it means:** Maven isn't installed or not in your PATH.

**How to fix (Mac):**
```bash
brew install maven
```

**How to fix (Windows):**
1. Download Maven from https://maven.apache.org/download.cgi
2. Extract to C:\Program Files\Apache\maven
3. Add to PATH environment variable

**Verify:**
```bash
mvn -version
```

---

### Issue 5: "npm: command not found" or "node: command not found"

**What it means:** Node.js/npm isn't installed.

**How to fix (Mac):**
```bash
brew install node
```

**How to fix (Windows):**
Download from https://nodejs.org/ and run the installer.

**Verify:**
```bash
node -v
npm -v
```

---

### Issue 6: "java: command not found" or Java version too old

**What it means:** Java isn't installed or you have an old version.

**Check your Java version:**
```bash
java -version
```

You need Java 17 or higher.

**How to fix (Mac):**
```bash
brew install openjdk@17
```

**How to fix (Windows):**
Download from https://www.oracle.com/java/technologies/downloads/

---

### Issue 7: Backend starts but immediately crashes

**Common reasons:**
1. Database port conflict
2. Missing dependencies
3. Syntax error in code

**Check the error message in terminal:**

**If you see "BUILD FAILURE":**
```bash
cd backend
mvn clean install
```

**If you see "ClassNotFoundException":**
Delete the target folder and rebuild:
```bash
rm -rf target
mvn clean install
```

---

### Issue 8: Frontend shows blank page

**How to diagnose:**

**Step 1:** Open browser console (F12)
- Look for JavaScript errors

**Step 2:** Check if React is running
- Terminal should show "Compiled successfully"
- Check http://localhost:3000

**Step 3:** Clear browser cache
- Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Step 4:** Reinstall dependencies
```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

---

### Issue 9: "Module not found" errors

**In Backend:**
```bash
cd backend
mvn clean install -U
```
The `-U` forces Maven to update dependencies.

**In Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 10: Changes to code aren't showing up

**For Backend:**
Spring Boot DevTools should auto-reload, but if not:
1. Stop the server (Ctrl+C)
2. Run again: `mvn spring-boot:run`

**For Frontend:**
React should auto-reload, but if not:
1. Stop the server (Ctrl+C)
2. Run again: `npm start`
3. Hard refresh browser: Cmd+Shift+R or Ctrl+Shift+R

---

### Issue 11: Database is empty or won't reset

**What's happening:**
H2 is an in-memory database. Data should reset when you restart the backend.

**To reset data:**
1. Stop backend (Ctrl+C)
2. Start backend again (`mvn spring-boot:run`)

**To verify data loaded:**
1. Open http://localhost:8080/h2-console
2. Use JDBC URL: `jdbc:h2:mem:ecommercedb`
3. Username: `sa`, Password: (empty)
4. Run query: `SELECT * FROM PRODUCTS;`

---

### Issue 12: "Cannot read properties of undefined"

**Common in React when:**
- Trying to access data before it's loaded
- API returns null or undefined

**Check:**
1. Is the product data actually loading? (Check Network tab in browser F12)
2. Are you handling loading states properly?

**Quick fix in Products.js:**
```javascript
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
if (!products || products.length === 0) return <div>No products</div>;
```

---

### Issue 13: Slow performance

**Backend slow?**
- Check terminal for database connection errors
- Make sure you're using the latest Java version

**Frontend slow?**
- Disable browser extensions
- Check if you have many tabs open
- Close other applications

**During development, it's normal for:**
- First build to take 2-5 minutes
- Hot-reload to take a few seconds

---

### Issue 14: Can't access H2 console

**Steps to fix:**

1. Make sure backend is running
2. Check `application.properties` has:
```properties
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```
3. Use correct URL: http://localhost:8080/h2-console
4. Use these credentials:
   - JDBC URL: `jdbc:h2:mem:ecommercedb`
   - Username: `sa`
   - Password: (leave empty)

---

## Getting Detailed Error Information

### Backend Errors
Look in the terminal running `mvn spring-boot:run`:
- Red text indicates errors
- Stack traces show exactly where the error occurred
- Line numbers help you find the problem

### Frontend Errors
1. Open browser DevTools (F12)
2. Check **Console** tab for JavaScript errors
3. Check **Network** tab to see API calls
   - Status 200 = success
   - Status 404 = not found
   - Status 500 = server error

---

## Still Having Issues?

### Create a diagnostic report:

1. **Check versions:**
```bash
java -version
mvn -version
node -v
npm -v
```

2. **Check if servers are running:**
```bash
# Mac/Linux
lsof -i :8080
lsof -i :3000

# Windows
netstat -ano | findstr :8080
netstat -ano | findstr :3000
```

3. **Test backend directly:**
Open http://localhost:8080/api/products in browser
- Should show JSON data
- If not, backend has an issue

4. **Check browser console:**
- Press F12
- Look for red error messages
- Note the exact error text

5. **Check terminal output:**
- Copy any red error messages
- Note if the server started successfully

---

## Prevention Tips

1. **Always run `mvn clean install` after:**
   - Pulling new code
   - Changing dependencies in pom.xml
   - Getting weird errors

2. **Always run `npm install` after:**
   - Pulling new code
   - Changing package.json
   - Getting module not found errors

3. **Keep terminals open:**
   - Don't close them while developing
   - Keep them visible so you see errors immediately

4. **Use two separate terminal windows:**
   - One for backend
   - One for frontend
   - Don't try to run both in one window

5. **Wait for startup:**
   - Backend: Wait for "Started EcommerceApplication"
   - Frontend: Wait for "Compiled successfully"
   - Don't interact until both are ready

---

## Emergency Reset

If everything is broken and you want to start fresh:

```bash
# Stop both servers (Ctrl+C in each terminal)

# Backend reset
cd backend
rm -rf target
mvn clean install
mvn spring-boot:run

# Frontend reset (in new terminal)
cd frontend
rm -rf node_modules build
npm install
npm start
```

This will take 5-10 minutes but should fix most issues.
