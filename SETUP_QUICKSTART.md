# Quick Start Guide

## Current Status
✅ **Frontend**: Ready (dependencies installed)  
⏳ **Backend**: Needs one manual command

## Complete Backend Setup Now

Choose ONE option:

### Windows PowerShell
```powershell
cd backend
.\run-maven.ps1
```

### Windows CMD
```cmd
.\run-maven-setup.cmd
```

### Manual (Any Shell)
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install
```

## After Backend Setup

### Run Tests
```bash
cd backend && mvn test
cd frontend && npm test
```

### Start Applications
```bash
# Backend (port 8080)
cd backend && mvn spring-boot:run

# Frontend (port 4200)
cd frontend && npm start
```

## Infrastructure (Optional)
```bash
cd infra && docker-compose up -d
```

---
See `INITIAL_SETUP_COMPLETE.md` for detailed information.
