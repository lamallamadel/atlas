# Quickstart: After Cloning the Repository

## Current Setup Status

✅ **Frontend**: Dependencies installed (1,178 packages)  
⚠️ **Backend**: Requires manual setup with Java 17 (see below)

## Complete Backend Setup (Required)

The backend requires Java 17. Run ONE of the following commands:

### Windows Command Prompt
```cmd
backend\run-mvn-with-java17.cmd clean install -DskipTests -gs settings.xml
```

### Windows PowerShell
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
mvn clean install -DskipTests -gs settings.xml
cd ..
```

This will take 2-5 minutes to download dependencies and build the backend.

## Optional: Install Playwright Browsers

For frontend E2E tests:

```cmd
cd frontend
npx playwright install
cd ..
```

## Verify Setup

### Backend
```cmd
cd backend
dir target\backend.jar
```
You should see the JAR file.

### Frontend
```cmd
cd frontend
dir node_modules
```
You should see the dependencies folder.

## Quick Commands

### Run Backend Tests
```cmd
cd backend
run-mvn-with-java17.cmd test
```

### Run Backend Server
```cmd
cd backend
run-mvn-with-java17.cmd spring-boot:run
```
Access at: http://localhost:8080

### Run Frontend Dev Server
```cmd
cd frontend
npm start
```
Access at: http://localhost:4200

### Run Frontend Tests
```cmd
cd frontend
npm test
```

### Run Frontend E2E Tests (requires backend running)
```cmd
cd frontend
npm run e2e
```

## Need Help?

- **Setup Details**: See `SETUP.md`
- **Development Guide**: See `AGENTS.md`
- **Project Overview**: See `README.md`
- **Setup Status**: See `INITIAL_SETUP_COMPLETE.md`
