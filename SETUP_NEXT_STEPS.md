# Next Steps to Complete Setup

## What's Already Done ✅

1. **Frontend Dependencies** - Installed (1,177 packages)
2. **Repository Configuration** - Updated .gitignore
3. **Helper Scripts** - Created in backend directory

## What You Need to Do 📋

### Step 1: Build the Backend (Required)

The backend Maven build requires Java 17 to be set as JAVA_HOME. Choose one of these methods:

**Method A - Using Helper Script (Easiest):**
```powershell
cd backend
.\mvn-java17.cmd clean package -DskipTests
```

**Method B - Using Node.js:**
```powershell
cd backend
node install-backend.js
```

**Method C - Setting JAVA_HOME Manually:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean package -DskipTests
```

This will:
- Download all Maven dependencies (~200+ packages)
- Compile the Java code
- Create `backend/target/backend.jar`
- Take approximately 3-5 minutes on first run

### Step 2: Install Playwright Browsers (Required for E2E Tests)

```powershell
cd frontend
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers for testing (~500MB).

## Verify Your Setup

After completing the above steps, verify everything works:

### Check Backend
```powershell
# Verify JAR was created
Test-Path backend\target\backend.jar
# Should return: True

# Try running the backend
cd backend
mvn spring-boot:run
# Should start on http://localhost:8080
# Press Ctrl+C to stop
```

### Check Frontend
```powershell
# Try running the frontend
cd frontend
npm start
# Should start on http://localhost:4200
# Press Ctrl+C to stop
```

### Run Tests
```powershell
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

## Common Issues & Solutions

### Issue: "JAVA_HOME is not defined correctly"
**Solution:** Use one of the helper scripts (Method A or B above) that set JAVA_HOME automatically.

### Issue: Maven downloads are slow
**Solution:** The backend/settings.xml is configured to use Maven Central directly. First build will be slow due to dependency downloads.

### Issue: Port 8080 already in use
**Solution:** Stop any running service on port 8080, or change the backend port in `backend/src/main/resources/application.yml`

### Issue: Port 4200 already in use
**Solution:** Stop any running service on port 4200, or run frontend with: `ng serve --port 4201`

## Development Workflow

Once setup is complete, use these commands for daily development:

### Start Full Stack
```powershell
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm start
```

### Run Tests
```powershell
# Backend unit tests
cd backend
mvn test

# Backend E2E tests (H2 database)
cd backend
mvn verify -Pbackend-e2e-h2

# Frontend unit tests
cd frontend
npm test

# Frontend E2E tests
cd frontend
npm run e2e
```

### Build for Production
```powershell
# Backend
cd backend
mvn clean package

# Frontend
cd frontend
npm run build
```

## Additional Resources

- **`AGENTS.md`** - Complete development guide with all commands
- **`README.md`** - Project overview and architecture
- **`SETUP.md`** - Detailed setup instructions
- **Backend API Docs** - http://localhost:8080/swagger-ui.html (when running)

## Need Help?

1. Check `AGENTS.md` for detailed command reference
2. Check `KNOWN_ISSUES.md` for common problems
3. Ensure Java 17 and Maven 3.8+ are properly installed
4. Verify Docker is running (needed for E2E tests with PostgreSQL)
