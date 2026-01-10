# Complete Backend Setup - Quick Guide

## Frontend Setup ✅ DONE
The frontend is fully set up and ready to use:
- All npm dependencies installed (1177 packages)
- Playwright browsers installed (v1.57.0)
- Ready for development and testing

## Backend Setup ⚠️ ACTION REQUIRED

Run ONE of these commands to complete the backend Maven build:

### Option 1: PowerShell (Simplest)
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

### Option 2: Use Existing Script
```powershell
cd backend
.\install-java17.ps1
```

### Option 3: Use Root Wrapper
```cmd
mvn17.cmd clean install -DskipTests -f backend\pom.xml
```

## Expected Output
You should see:
```
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  XX.XXX s
```

## After Setup
Once backend build completes, you can:

**Run Tests:**
```powershell
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

**Start Dev Servers:**
```powershell
# Backend (port 8080)
cd backend
mvn spring-boot:run

# Frontend (port 4200)
cd frontend
npm start
```

**Run E2E Tests:**
```powershell
cd frontend
npm run e2e:fast    # Fast mode (single browser, H2 database)
npm run e2e         # Full mode
```

See `AGENTS.md` for all available commands and detailed documentation.
