# Initial Repository Setup Instructions

## Overview

This repository requires initial setup for both backend (Java/Maven) and frontend (Node/Angular) components. Due to PowerShell session initialization issues, please run the following commands manually.

## Prerequisites

- **Java 17** (JDK 17.0.5.8 or later) - Already configured in `backend/toolchains.xml`
- **Maven 3.6+**
- **Node.js** (v24+ detected) and npm
- **Docker** (for PostgreSQL E2E tests - optional for initial setup)

## Setup Steps

### 1. Backend Setup (Java/Maven)

The backend uses Maven and requires Java 17. The toolchains.xml is already configured with the correct Java path.

```powershell
# Navigate to backend directory
cd backend

# Install Maven dependencies (skip tests for faster initial setup)
mvn clean install -DskipTests --toolchains toolchains.xml

# Verify build works
mvn clean package -DskipTests
```

**Alternative if toolchains don't work:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

### 2. Frontend Setup (Node/Angular)

The frontend uses npm and Angular CLI.

```powershell
# Navigate to frontend directory (from repo root)
cd frontend

# Install npm dependencies
npm install

# Install Playwright browsers for E2E tests
npx playwright install
```

**Note:** `npm install` may take 5-10 minutes depending on your connection speed.

### 3. Verify Setup

After setup is complete, verify that all components are ready:

#### Backend:
```powershell
cd backend
mvn test -Dtest=SampleTest
```

#### Frontend:
```powershell
cd frontend
npm run build
```

## What Got Configured

1. ✅ Backend `toolchains.xml` already points to Java 17 at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
2. ⏳ Backend Maven dependencies need to be installed
3. ⏳ Frontend npm dependencies need to be installed
4. ⏳ Playwright browsers need to be installed

## Next Steps

After running the setup commands above, you can:

- **Run backend tests**: `cd backend && mvn test`
- **Run backend E2E tests (H2)**: `cd backend && mvn verify -Pbackend-e2e-h2`
- **Run backend server**: `cd backend && mvn spring-boot:run`
- **Run frontend dev server**: `cd frontend && npm start`
- **Run frontend E2E tests**: `cd frontend && npm run e2e`

## Troubleshooting

### Maven Commands Fail

If Maven commands fail with Java version errors:

1. Verify Java 17 is installed at the path in `backend/toolchains.xml`
2. Set `JAVA_HOME` environment variable manually:
   ```powershell
   $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
   ```
3. Verify with: `mvn --version` (should show Java 17)

### npm install Takes Too Long

If `npm install` is very slow:

1. Try with `npm ci` instead (uses package-lock.json)
2. Clear npm cache: `npm cache clean --force`
3. Check your internet connection

### Playwright Install Fails

If Playwright browser installation fails:

1. Try with explicit install: `npx playwright install chromium`
2. Install system dependencies (if on Linux): `npx playwright install-deps`

## Build Commands (from AGENTS.md)

### Backend
- **Build**: `cd backend && mvn clean package`
- **Test**: `cd backend && mvn test`
- **E2E Tests (H2)**: `cd backend && mvn verify -Pbackend-e2e-h2`

### Frontend
- **Build**: `cd frontend && npm run build`
- **Test**: `cd frontend && npm test`
- **E2E Tests**: `cd frontend && npm run e2e`

## Environment Note

The repository is already configured with:
- `.gitignore` - comprehensive ignore rules for build artifacts
- `backend/toolchains.xml` - Java 17 configuration
- `frontend/package.json` - all dependencies listed
- Build profiles for H2 and PostgreSQL testing

All that's needed is to run the dependency installation commands above.
