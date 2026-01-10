# Quick Start - Newly Cloned Repository

## Current Status

✅ **Frontend**: Dependencies installed and ready  
⚠️ **Backend**: Requires Maven build (manual step needed)

## Complete Setup (2 minutes)

Run ONE of these commands from the repository root:

**Windows Command Prompt:**
```cmd
complete-setup.cmd
```

**PowerShell:**
```powershell
.\complete-setup.ps1
```

This will:
1. Build the backend with Java 17
2. Install Playwright browsers for E2E tests

## Why Manual Setup?

The automated setup completed the frontend installation but security restrictions prevent automated environment variable modification required for the backend Java 17 build. The scripts above handle this safely.

## Verify Setup

After running the setup script:

```cmd
# Test backend
cd backend
mvn test

# Test frontend
cd frontend
npm test
```

## Start Development

```cmd
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm start
```

Then access:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html

## Alternative: Manual Steps

If you prefer to run commands manually:

```cmd
# Set Java 17
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot

# Build backend
cd backend
mvn clean install -DskipTests -gs settings.xml
cd ..

# Install Playwright (optional)
cd frontend
npx playwright install
cd ..
```

## Need Help?

- **Full Setup Guide**: See `SETUP_STATUS.md`
- **Development Guide**: See `AGENTS.md`
- **Project Overview**: See `README.md`

## Tech Stack

- **Backend**: Spring Boot 3.2.1 + Java 17 + Maven
- **Frontend**: Angular 16 + TypeScript
- **Database**: PostgreSQL (prod) / H2 (test)
- **Testing**: JUnit 5 + Playwright
