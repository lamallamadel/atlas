# Complete the Repository Setup

## What's Already Done ✓

- Frontend dependencies installed (`frontend/node_modules` with 683 packages)
- .gitignore updated for setup artifacts

## Complete the Setup Now

### Option 1: Quick Setup (Recommended)

Use one of the existing helper scripts that handle JAVA_HOME automatically:

```bash
cd backend
mvn-java17.cmd clean install -DskipTests
```

### Option 2: Set JAVA_HOME First

If you prefer to set JAVA_HOME yourself:

**PowerShell:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

**Command Prompt:**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -DskipTests
```

### Option 3: Using Node.js Script

```bash
cd backend
node install-backend.js
```

## Install Playwright Browsers

After the backend is set up, install Playwright browsers for E2E testing:

```bash
cd frontend
npx playwright install
```

## Verify Setup

**Check Java Version:**
```bash
cd backend
mvn --version
# Should show: Apache Maven 3.8.6, Java version: 17
```

**Run Backend Tests:**
```bash
cd backend
mvn test
```

**Run Frontend Tests:**
```bash
cd frontend
npm test
```

## Quick Start

Once setup is complete, you can start developing:

**Start Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Start Frontend:**
```bash
cd frontend
npm start
```

Access the application at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html

See `AGENTS.md` for more details on build, test, and E2E commands.
