# Initial Repository Setup Instructions

This repository has been cloned but requires initial setup before you can build, lint, or test.

## What Needs to Be Done

### 1. Frontend Setup (✅ COMPLETE)

The frontend dependencies have been successfully installed:

```powershell
cd frontend
npm install
```

**Status:** ✅ Complete - 1,178 packages installed

---

### 2. Backend Setup (⚠️ REQUIRES MANUAL EXECUTION)

Due to security restrictions on environment variable manipulation, the backend Maven setup requires you to run a setup script manually.

## Setup Options

### Option A: Run the Automated Setup Script (RECOMMENDED)

Execute the setup script that has been prepared for you:

```powershell
.\setup-repo-initial.ps1
```

This script will:
1. Copy `toolchains.xml` to your `~/.m2/` directory (for Java 17 support)
2. Set up Java 17 environment temporarily
3. Run `mvn clean install -DskipTests` in the backend directory
4. Frontend is already set up

---

### Option B: Manual Setup

If the automated script doesn't work, follow these manual steps:

#### Step 1: Copy Maven Toolchains Configuration

```powershell
# Create .m2 directory if it doesn't exist
if (-not (Test-Path ~\.m2)) { New-Item -ItemType Directory -Path ~\.m2 }

# Copy toolchains.xml
Copy-Item -Path toolchains.xml -Destination ~\.m2\toolchains.xml -Force
```

#### Step 2: Run Backend Maven Install

```powershell
# Set Java 17 temporarily
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Install backend dependencies
cd backend
mvn clean install -DskipTests
```

---

### Option C: Use the Prepared Backend Script

A simpler alternative using the backend's own install script:

```powershell
cd backend
.\install-java17.ps1
```

---

## Verification

After setup is complete, verify the installation:

### Backend Verification

```powershell
# Check if backend compiled successfully
Test-Path backend\target\backend.jar
```

Should return: `True`

### Frontend Verification

```powershell
# Check if node_modules exists
Test-Path frontend\node_modules
```

Should return: `True` (already complete ✅)

---

## Next Steps After Setup

Once setup is complete, you can:

### Run the Development Servers

**Backend:**
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn spring-boot:run
```

**Frontend:**
```powershell
cd frontend
npm start
```

### Run Tests

**Backend Tests:**
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn test
```

**Frontend Tests:**
```powershell
cd frontend
npm test
```

### Run Builds

**Backend Build:**
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean package
```

**Frontend Build:**
```powershell
cd frontend
npm run build
```

### Run Linters

**Frontend Lint:**
```powershell
cd frontend
npm run lint
```

---

## Troubleshooting

### Issue: "JAVA_HOME is not defined correctly"

**Solution:** Ensure Java 17 is set before running Maven:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Issue: Maven uses wrong Java version

**Solution:** Make sure toolchains.xml is in `~/.m2/toolchains.xml` and contains the correct Java 17 path.

### Issue: Port conflicts when starting servers

**Solution:** 
- Backend runs on port 8080
- Frontend runs on port 4200
- Ensure these ports are not in use by other applications

---

## Summary of Setup Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Frontend dependencies (npm) | ✅ Complete | None - 1,178 packages installed |
| Backend dependencies (Maven) | ⚠️ Pending | Run setup script or manual steps above |
| Maven toolchains configuration | ⚠️ Pending | Will be handled by setup script |

---

## Quick Start (After Backend Setup)

```powershell
# Terminal 1 - Backend
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm start
```

Access the application:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html

---

For more detailed information, see:
- `AGENTS.md` - Development guide with all commands
- `SETUP.md` - Detailed setup instructions
- `README.md` - Project overview
