# Initial Repository Setup Instructions

This document provides instructions for setting up the repository after cloning.

## What Has Been Done

1. ✅ **Frontend Dependencies Installed**: `npm install` has been successfully run in the `frontend` directory
   - 1187 packages installed
   - Ready for build, test, and development

2. ✅ **Configuration Files Created**:
   - `backend/.mavenrc` - Maven configuration for Unix-like systems
   - `backend/mavenrc_pre.bat` - Maven pre-execution batch script for Windows
   - `mvn-java17.bat` - Maven wrapper script with Java 17
   - `run-setup.bat` - Complete setup script
   - `setup-initial.ps1` - PowerShell setup script
   - `initial-setup.cmd` - Batch setup script

3. ✅ **Toolchains Configuration**: The `toolchains.xml` file exists in `C:\Users\a891780\.m2\` directory
   - Configured for Java 17 at `C:\Environement\Java\jdk-17.0.5.8-hotspot`

## What Still Needs To Be Done

Due to security restrictions in the execution environment, the following steps need to be completed manually:

### 1. Backend Setup (Maven)

The backend dependencies need to be installed. Run ONE of the following:

**Option A - Using the provided batch script:**
```cmd
run-setup.bat
```

**Option B - Using the PowerShell script:**
```powershell
.\setup-initial.ps1
```

**Option C - Manual commands:**
```cmd
cd backend
mvn clean install -gs settings.xml -DskipTests
cd ..
```

**Note**: The system has Java 8 set in JAVA_HOME, but the project requires Java 17. The toolchains.xml is configured to use Java 17. If you encounter issues, you may need to temporarily set JAVA_HOME:

```cmd
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
cd backend
mvn clean install -gs settings.xml -DskipTests
cd ..
```

### 2. Playwright Browsers Installation

After the backend is set up, install Playwright browsers for E2E testing:

```cmd
cd frontend
npx playwright install
cd ..
```

## Verification

After completing the setup, verify everything is working:

### Backend Verification:
```cmd
cd backend
mvn test
```

### Frontend Verification:
```cmd
cd frontend
npm test
```

### E2E Tests:
```cmd
cd frontend
npm run e2e:fast
```

## Quick Reference Commands

From the repository root:

- **Build backend**: `cd backend && mvn clean package`
- **Run backend**: `cd backend && mvn spring-boot:run`
- **Test backend**: `cd backend && mvn test`
- **Backend E2E (H2)**: `cd backend && mvn verify -Pbackend-e2e-h2`
- **Backend E2E (PostgreSQL)**: `cd backend && mvn verify -Pbackend-e2e-postgres`
- **Test frontend**: `cd frontend && npm test`
- **Run frontend**: `cd frontend && npm start`
- **E2E tests (fast)**: `cd frontend && npm run e2e:fast`
- **E2E tests (full)**: `cd frontend && npm run e2e:full`

## Troubleshooting

### JAVA_HOME Issues

If you encounter "JAVA_HOME environment variable is not defined correctly":

1. Check current JAVA_HOME: `echo %JAVA_HOME%`
2. Set it to Java 17: `set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"`
3. Verify: `java -version` (should show Java 17)

### Maven Issues

If Maven fails to download dependencies:

1. The backend has a `settings.xml` configured to use Maven Central directly
2. Use it with: `mvn -gs settings.xml [command]`
3. Check internet connectivity if downloads fail

### Playwright Installation

If Playwright browsers fail to install:

1. Ensure you have sufficient disk space
2. Try with admin privileges if needed
3. Alternative: `npx playwright install --with-deps`

## Environment Information

- **Java 17 Path**: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- **Maven**: 3.8.6 (`C:\Environement\maven-3.8.6`)
- **Node/npm**: 8.19.2
- **Maven Local Repository**: `C:\Users\a891780\.m2`

## Next Steps

Once setup is complete:

1. Review `AGENTS.md` for development guidelines
2. Check `README.md` for project overview
3. See `SETUP.md` for detailed setup information
4. Start development with `backend/mvn spring-boot:run` and `frontend/npm start`
