# Quick Start - Complete Setup Now

## Current Status
✅ Frontend: Ready  
⚠️ Backend: Needs one command

## Complete Backend Setup (Choose One)

### Windows Command Prompt (Recommended)
```cmd
cd backend
do-install.cmd
```

### PowerShell
```powershell
cd backend
.\install-java17.ps1
```

### Node.js (Cross-platform)
```bash
cd backend
node install.js
```

## After Setup Completes

### Start Everything
```powershell
# PowerShell
.\dev.ps1 up

# Bash (Linux/Mac)
./dev up
```

### Run Tests
```bash
# Backend unit tests
cd backend
mvn test

# Backend E2E tests
mvn verify -Pbackend-e2e-h2

# Frontend E2E tests
cd ../frontend
npm run e2e
```

### Access the Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html
- Health Check: http://localhost:8080/actuator/health

## Build Commands Reference

### Backend
```bash
cd backend
mvn clean package      # Build
mvn test              # Run tests
mvn spring-boot:run   # Start dev server
```

### Frontend
```bash
cd frontend
npm run build         # Production build
npm test             # Unit tests
npm run lint         # Code linting
npm start            # Dev server
```

## That's It!
See **AGENTS.md** for complete development workflows and testing procedures.
