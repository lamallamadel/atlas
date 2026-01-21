# Initial Repository Setup Instructions

This repository has been cloned and is ready for initial setup. Due to security restrictions in the automated environment, please run the following commands manually to complete the setup.

## Prerequisites

- **Java 17**: JDK 17.0.5.8 or later must be installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- **Maven 3.6+**: Already available at `C:\Environement\maven-3.8.6`
- **Node.js**: Already available at `C:\Environement\nodejs`

## Quick Setup (Recommended)

### Option 1: Using PowerShell Script

Run the provided setup script:

```powershell
.\Initialize-Repository.ps1
```

This script will:
1. Configure Java 17 environment
2. Run Maven install for backend
3. Run npm install for frontend

### Option 2: Using Batch File

Run the provided batch file:

```cmd
.\setup-initial-repo.cmd
```

## Manual Setup (Step-by-Step)

If the automated scripts don't work, follow these steps:

### 1. Backend Setup (Maven)

```powershell
# Using the mvn17.ps1 wrapper (sets JAVA_HOME automatically)
cd backend
..\mvn17.ps1 clean install -DskipTests

# Alternative: Set JAVA_HOME manually
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

This will:
- Download all Maven dependencies
- Compile the Spring Boot application
- Create the target directory with build artifacts
- Skip running tests (tests can be run later with `mvn test`)

**Expected output**: `BUILD SUCCESS` and a `target/` directory containing `backend-0.0.1-SNAPSHOT.jar`

### 2. Frontend Setup (npm)

```powershell
cd frontend
npm install
```

This will:
- Download all npm dependencies
- Create the `node_modules/` directory
- Prepare the Angular application for development

**Expected output**: No errors and a `node_modules/` directory

### 3. Optional: Install Playwright Browsers

If you plan to run end-to-end tests:

```powershell
cd frontend
npx playwright install
```

## Verification

After setup is complete, verify everything works:

### Backend

```powershell
cd backend
..\mvn17.ps1 test
```

### Frontend

```powershell
cd frontend
npm test
```

## What's Been Prepared

The following helper files have been created for you:

- **`mvn17.ps1`**: PowerShell wrapper that sets JAVA_HOME to Java 17 before running Maven
- **`mvn17.cmd`**: Batch file wrapper for the same purpose
- **`toolchains.xml`**: Maven toolchains configuration (copy to `%USERPROFILE%\.m2\toolchains.xml` if needed)
- **`Initialize-Repository.ps1`**: Complete setup script
- **`setup-initial-repo.cmd`**: Batch file for complete setup

## Common Issues

### JAVA_HOME Not Defined

If you see: `The JAVA_HOME environment variable is not defined correctly`

**Solution**: Use the provided `mvn17.ps1` or `mvn17.cmd` wrappers, or set JAVA_HOME manually:

```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Maven Download Issues

If Maven cannot download dependencies:

1. Check your internet connection
2. Check if a proxy is required
3. Maven uses `~/.m2/repository` for dependency cache

### npm Install Fails

If npm install fails:

1. Try clearing the npm cache: `npm cache clean --force`
2. Delete `package-lock.json` and try again
3. Check Node.js version: `node --version` (should be 16+)

## Next Steps

After setup is complete:

- **Start backend**: `cd backend && mvn spring-boot:run` (using mvn17.ps1)
- **Start frontend**: `cd frontend && npm start`
- **Run tests**: `cd backend && mvn test` (using mvn17.ps1)
- **Run E2E tests**: `cd frontend && npm run e2e`

See `AGENTS.md` for detailed development commands and workflow.
