# Initial Repository Setup - Status

## ✅ Completed

### Frontend Setup
- **npm install**: ✅ Successfully completed
  - Installed 1188 packages
  - Location: `frontend/node_modules/`
  - Some deprecation warnings (expected with Angular 16)
  - 27 vulnerabilities reported (need review if required)

### Environment Verification
- Node.js: Available (npm 8.19.2)
- Maven: Available (3.8.6)
- Java 17: Available at `C:\Environement\Java\jdk-17.0.5.8-hotspot`

## ⚠️ Requires Manual Action

### Backend Setup (Maven)
The backend Maven setup requires manual action due to Maven proxy configuration conflicts.

**Issue**: The global Maven settings file (`~/.m2/settings.xml`) contains a proxy configuration pointing to `localhost:8888`, which is not accessible and prevents Maven from downloading dependencies.

**Solution**: Run one of the following commands to complete backend setup:

#### Option 1: Using the wrapper script (Recommended)
```cmd
.\mvn17.cmd -f backend\pom.xml clean install -DskipTests
```

#### Option 2: Using PowerShell script
```powershell
cd backend
.\setup.cmd
```

#### Option 3: Manual Maven command with Java 17
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

#### Option 4: Copy project settings to override global settings
```powershell
Copy-Item backend\settings.xml $env:USERPROFILE\.m2\settings.xml -Force
cd backend
mvn clean install -DskipTests
```

### Playwright Browsers Installation
Playwright browsers need to be installed for E2E tests.

**Command**:
```powershell
cd frontend
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers needed for cross-browser E2E testing.

## 📋 Verification Commands

After completing the manual steps above, verify the setup:

### Backend
```powershell
# Check if backend compiles
cd backend
mvn compile

# Run backend tests
mvn test

# Start backend server
mvn spring-boot:run
```

### Frontend
```powershell
# Check if frontend builds
cd frontend
npm run build

# Run frontend tests
npm test

# Start frontend dev server
npm start
```

### E2E Tests
```powershell
cd frontend
npm run e2e:fast
```

## 📝 Notes

1. **Java Version**: The project requires Java 17. The wrapper scripts (`mvn17.cmd`) automatically set `JAVA_HOME` to the correct version.

2. **Maven Settings**: The project includes `backend/settings.xml` which configures Maven to use Maven Central directly without proxies. This should be used instead of the global settings.

3. **Toolchains**: The project includes `backend/toolchains.xml` which can be copied to `~/.m2/toolchains.xml` to configure Java 17 for Maven builds across multiple Java installations.

4. **Dependencies**: 
   - Backend uses Spring Boot 3.2.1 with Java 17
   - Frontend uses Angular 16 with TypeScript 5.1
   - E2E tests use Playwright 1.57.0

## 🚀 Quick Start (After Setup)

Once setup is complete:

```powershell
# Terminal 1: Start backend
cd backend
mvn spring-boot:run

# Terminal 2: Start frontend  
cd frontend
npm start

# Terminal 3: Run E2E tests
cd frontend
npm run e2e
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
