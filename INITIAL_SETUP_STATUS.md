# Initial Setup Status

## Summary

This repository has been partially set up with automated tools. Due to security restrictions on environment variable modification, the backend setup requires one manual command.

## ✅ Completed Setup

### Frontend (Angular) - READY TO USE
- **Status**: ✅ Fully configured and ready
- **Dependencies**: All npm packages installed (669 packages in node_modules)
- **Location**: `frontend/` directory
- **Commands available**:
  ```powershell
  cd frontend
  npm start          # Start dev server (http://localhost:4200)
  npm run build      # Production build
  npm test           # Run tests
  npm run lint       # Lint code
  ```

### Repository Configuration
- **.gitignore**: ✅ Properly configured
  - `node_modules/` ignored
  - `target/` ignored (Maven build output)
  - `dist/` ignored (Angular build output)
  - IDE files ignored
  - OS files ignored

### Helper Scripts Created
- ✅ `backend/setup.cmd` - Windows batch script for backend setup
- ✅ `backend/run-maven.ps1` - PowerShell wrapper for Maven with Java 17
- ✅ `backend/mvn-java17.cmd` - Convenient Maven wrapper for daily use
- ✅ `setup-all.ps1` - Complete setup script (for manual execution)
- ✅ `setup-all.cmd` - Complete setup script (CMD version)
- ✅ `dev.ps1` - Development stack manager

## ⚠️ Manual Step Required

### Backend (Spring Boot) - ONE COMMAND NEEDED

The backend setup could not be completed automatically due to security restrictions that prevent modifying the `JAVA_HOME` environment variable in the automated session.

**Solution**: Run ONE of the following commands in a new terminal:

#### Option 1: Using the Setup Script (Recommended)
```cmd
cd backend
setup.cmd
```

#### Option 2: Using PowerShell
```powershell
cd backend
.\run-maven.ps1
```

#### Option 3: Manual Commands
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

**What this does**:
- Sets JAVA_HOME to Java 17
- Downloads all Maven dependencies
- Compiles the Spring Boot application
- Runs the build (skipping tests for faster initial setup)
- Takes approximately 2-5 minutes

**After running this**, the backend will be fully operational and you can:
```powershell
cd backend
mvn test                 # Run tests
mvn spring-boot:run      # Start backend server
mvn clean package        # Build JAR file
```

## 📋 Quick Start Guide

### Immediate Use (Frontend Only)
```powershell
cd frontend
npm start
# Open browser to http://localhost:4200
```

### Complete Stack (After Backend Setup)
```powershell
# Option 1: Use the development script
.\dev.ps1 up

# Option 2: Manual startup
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - Infrastructure (optional)
cd infra
docker-compose up -d
```

## 🔧 Available Commands

### Development Scripts
- `.\dev.ps1 up` - Start full stack
- `.\dev.ps1 down` - Stop all services
- `.\dev.ps1 status` - Check service status
- `.\dev.ps1 logs [service]` - View logs

### Backend Commands (After Setup)
- `mvn clean package` - Build the application
- `mvn test` - Run all tests
- `mvn spring-boot:run` - Start the backend server
- `mvn-java17.cmd <command>` - Run any Maven command with Java 17

### Frontend Commands (Available Now)
- `npm start` - Start dev server
- `npm run build` - Production build
- `npm test` - Run tests with Karma
- `npm run lint` - Run ESLint

## 📦 What's Installed

### Frontend Dependencies
- Angular 16.2.0
- Angular Material 16.2.0
- RxJS 7.8.0
- TypeScript 5.1.3
- Jasmine & Karma (testing)
- ESLint (linting)
- Total: 669 packages

### Backend Dependencies (Will be installed after manual step)
- Spring Boot 3.2.1
- Spring Web
- Spring Data JPA
- Spring Validation
- Spring Actuator
- Flyway (database migrations)
- PostgreSQL driver
- H2 database (for tests)
- SpringDoc OpenAPI 2.3.0

## 🎯 Verification

### Check Frontend Setup (Available Now)
```powershell
cd frontend
npm run build
# Should complete successfully
```

### Check Backend Setup (After Manual Step)
```powershell
cd backend
mvn --version
# Should show Java 17

mvn test
# Should run tests successfully
```

## ❓ Why Manual Step Required?

The automated setup process encountered security restrictions:
- Cannot modify environment variables (`JAVA_HOME`) in the automated session
- Cannot execute scripts that spawn processes with modified environments
- Cannot run batch/PowerShell scripts with environment modifications

This is a security feature to prevent unauthorized environment manipulation. The solution is straightforward: run the setup command in a terminal where you have full control.

## 📚 Additional Documentation

- **[AGENTS.md](./AGENTS.md)** - Complete developer guide with all commands
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[README.md](./README.md)** - Project overview

## 🎉 Next Steps

1. **Run the backend setup** using one of the methods above
2. **Verify the setup** by running `mvn test` in the backend directory
3. **Start developing** using `.\dev.ps1 up` or individual commands
4. **Read AGENTS.md** for complete development workflow

---

**TL;DR**: 
- ✅ Frontend is ready to use immediately
- ⚠️ Backend needs one manual command: `cd backend && setup.cmd`
- After backend setup, everything will be fully operational
