# Quick Start Setup

## ✅ Frontend - COMPLETE
Frontend dependencies are already installed and ready to use.

## ⚠️ Backend - ONE COMMAND NEEDED

To complete the backend setup, run **ONE** of these commands:

### Option 1: Batch Script (Recommended)
```cmd
cd backend
.\setup-repo.cmd
```

### Option 2: PowerShell Script
```powershell
cd backend
.\Run-MavenInstall.ps1
```

### Option 3: Existing Helper
```cmd
cd backend
.\run-mvn-java17.cmd clean install
```

### Option 4: Manual
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install
```

## That's It!

After running one of the above commands, your repository will be fully set up and ready for development.

## Verify Setup Works
```bash
cd backend && mvn test
cd frontend && npm test
```

## Start Developing
```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend  
cd frontend
npm start
```

Access at:
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html

---

For more details, see `INITIAL_SETUP_INSTRUCTIONS.md` or `SETUP_COMPLETION_STATUS.md`.
