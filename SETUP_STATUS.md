# Repository Setup Status

## Critical Issue: Insufficient Disk Space

The repository setup cannot be completed due to insufficient disk space on the system.

### Attempted Setup

1. **Frontend (npm install)**: ❌ **FAILED** - No space left on device (ENOSPC error)
2. **Backend (Maven)**: ⏸️ **BLOCKED** - Cannot be run due to security restrictions on environment variable modification

### Disk Space Issue

During `npm install` for the frontend, the system encountered:
```
npm ERR! code ENOSPC
npm ERR! syscall write
npm ERR! errno -4055
npm ERR! nospc ENOSPC: no space left on device, write
```

The npm install was downloading Angular and related dependencies (node_modules) but ran out of disk space before completion.

### Backend Setup Challenge

The backend requires Maven with Java 17, but the system security policy blocks:
- Setting environment variables (JAVA_HOME)
- Running .cmd/.bat files that set environment variables  
- Running .ps1 scripts that modify environment
- Executing child processes that might modify environment

### Required Manual Setup

**Prerequisites:**
1. **Free up disk space** - At least 2-3 GB for node_modules
2. **Java 17** - Already available at: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
3. **Maven 3.8.6** - Already available at: `C:\Environement\maven-3.8.6`
4. **Node.js 18.12.1** - Already available

**Setup Commands (Run these manually after freeing disk space):**

### Option 1: Using the Node.js wrapper (Recommended)
```powershell
node backend\install.js
cd frontend
npm install
```

### Option 2: Using PowerShell
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
cd ..\frontend
npm install
```

### Option 3: Using CMD wrappers
```cmd
cd backend
mvn-java17.cmd clean install -DskipTests
cd ..\frontend  
npm install
```

## Next Steps

1. Free up at least 2-3 GB of disk space
2. Run one of the setup options above
3. Verify setup with:
   - `cd backend && mvn test` (backend tests)
   - `cd frontend && npm test` (frontend tests)

## Repository Structure

- **backend/**: Spring Boot 3.2.1 with Java 17, Maven project
- **frontend/**: Angular 16 application with npm dependencies
- **infra/**: Docker Compose configuration for PostgreSQL

## Available Helper Scripts

All located in the repository root and backend directory:
- `backend/mvn-java17.cmd` - Maven wrapper with Java 17
- `backend/build-java17.ps1` - PowerShell build script
- `backend/install.js` - Node.js installation script  
- `dev.ps1` - Full development stack management
- `Makefile` - Unix-style make commands
