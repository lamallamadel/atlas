# Quick Start - Complete Backend Setup

## ✅ Frontend is Ready!
The frontend dependencies are already installed. No action needed.

## ⚠️ Complete Backend Setup (Required)

Run **ONE** of these commands:

### Option 1: Simple (Recommended)
```cmd
mvn17.cmd clean install -DskipTests -f backend\pom.xml
```

### Option 2: PowerShell
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests --toolchains toolchains.xml
```

---

## After Setup: Build & Test Commands

### Backend
```powershell
cd backend

# Build
mvn clean package

# Test
mvn test

# Run (don't run yet - just note for later)
mvn spring-boot:run
```

### Frontend
```powershell
cd frontend

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Run (don't run yet - just note for later)
npm start
```

---

## That's It!
After running the Maven command, the repository will be fully set up.
See **INITIAL_SETUP_STATUS.md** for complete details.
