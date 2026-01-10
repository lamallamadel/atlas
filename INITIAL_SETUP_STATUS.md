# Initial Repository Setup Status

## Summary

The repository has been partially set up. Frontend setup is **COMPLETE**, but backend Maven build requires manual execution due to security restrictions.

## ✅ Completed

### Frontend (Angular)
- ✅ **npm dependencies installed** - All Node.js packages are installed in `frontend/node_modules`
- ✅ **Playwright browsers installed** - E2E test browsers are ready

### Configuration Files
- ✅ **Toolchains.xml configured** - Maven toolchains configured with Java 17 path
- ✅ **Settings.xml configured** - Maven settings configured to bypass proxy and use Maven Central
- ✅ **Helper scripts created** - Multiple helper scripts available for backend setup

## ⏳ Requires Manual Action

### Backend (Spring Boot / Maven)
The Maven build for the backend needs to be run manually. Security restrictions prevent automated execution of Maven with environment variable configuration.

## Next Steps

### Option 1: Use Existing Helper Script (Recommended)

Run the pre-existing setup script from the repository root:

```powershell
.\SETUP_BACKEND.ps1
```

This script will:
1. Set JAVA_HOME to Java 17
2. Run `mvn clean install` with appropriate settings
3. Restore original environment variables

### Option 2: Manual Maven Command

```powershell
# From repository root
cd backend

# Set Java 17 environment (in your current session)
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Run Maven install
mvn clean install --toolchains ..\toolchains.xml --settings settings.xml

# Go back to root
cd ..
```

### Option 3: Use the Maven Wrapper Scripts

The backend directory contains wrapper scripts that automatically set Java 17:

```powershell
cd backend
.\mvn-java17.cmd clean install -s settings.xml
cd ..
```

Or use the simpler wrapper:

```cmd
cd backend
mvn.cmd clean install -s settings.xml
cd ..
```

## Verification

After completing the backend setup, verify everything is ready:

```powershell
# Check backend build artifacts
Test-Path backend\target\backend.jar

# Check frontend dependencies
Test-Path frontend\node_modules

# Check Playwright browsers
npx playwright --version
```

## Available Commands

Once setup is complete, you can use these commands:

### Backend
```powershell
cd backend

# Build
mvn clean package

# Run tests
mvn test

# Run E2E tests (H2)
mvn verify -Pbackend-e2e-h2

# Run E2E tests (PostgreSQL)
mvn verify -Pbackend-e2e-postgres

# Start dev server
mvn spring-boot:run
```

### Frontend
```powershell
cd frontend

# Install dependencies (already done)
npm install

# Start dev server
npm start

# Run unit tests
npm test

# Run lint
npm run lint

# Run E2E tests
npm run e2e

# Run E2E tests (fast mode)
npm run e2e:fast
```

## Project Structure

```
/
├── backend/              # Spring Boot application (Java 17 + Maven)
│   ├── src/
│   ├── pom.xml
│   ├── settings.xml     # Maven settings (proxy bypass)
│   ├── toolchains.xml   # Maven toolchains (Java 17)
│   └── mvn*.cmd         # Maven wrapper scripts
├── frontend/            # Angular application
│   ├── src/
│   ├── e2e/             # Playwright E2E tests
│   ├── node_modules/    # ✅ Installed
│   └── package.json
├── infra/               # Docker infrastructure
├── toolchains.xml       # Root toolchains configuration
└── SETUP_BACKEND.ps1    # Backend setup script
```

## Troubleshooting

### Maven Cannot Find Java
If you get "JAVA_HOME is not defined correctly":
1. Verify Java 17 exists: `Test-Path C:\Environement\Java\jdk-17.0.5.8-hotspot`
2. Use one of the wrapper scripts that set JAVA_HOME automatically
3. Or manually set JAVA_HOME in your PowerShell session

### Proxy Issues
The `settings.xml` file in the backend directory is configured to bypass proxies and use Maven Central directly. If you still encounter proxy issues:
1. Check your system proxy settings
2. Verify the `settings.xml` content
3. Try using `-s settings.xml` flag explicitly

### Port Already in Use
If Maven tests fail due to port conflicts (especially PostgreSQL port 5432):
```powershell
# Find and stop the process using the port
Get-NetTCPConnection -LocalPort 5432
Stop-Process -Id <PID>
```

## Reference

See `AGENTS.md` for comprehensive development guide including:
- Build, lint, and test commands
- E2E testing configurations
- Docker setup for infrastructure
- Troubleshooting guide
