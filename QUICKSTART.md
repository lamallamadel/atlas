# Quick Start Guide

## ✅ Frontend - Ready Now
```powershell
cd frontend
npm start
# Open http://localhost:4200
```

## ⚠️ Backend - One Command Required

Open a **new terminal** and run:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

Or use the helper script:
```powershell
cd backend
.\run-maven.ps1
```

## After Backend Setup

Start everything:
```powershell
.\dev.ps1 up
```

---

See [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) for full details.
