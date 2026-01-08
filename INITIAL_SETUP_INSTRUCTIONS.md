# Initial Repository Setup Instructions

This document provides step-by-step instructions for the initial setup of this repository.

## Prerequisites

- **Java 17** (JDK 17.0.5.8 or later) - Located at: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- **Maven 3.6+** - Located at: `C:\Environement\maven-3.8.6`
- **Node.js and npm** - For frontend dependencies
- **Docker** - For infrastructure and E2E tests with PostgreSQL

## Setup Steps

### Option 1: Using the Provided Setup Script (Recommended)

Run the setup script from the repository root:

**Windows (PowerShell or Command Prompt):**
```cmd
setup-repo.cmd
```

This script will:
1. Set Java 17 as JAVA_HOME
2. Install backend dependencies (Maven)
3. Install frontend dependencies (npm)
4. Install Playwright browsers for E2E testing

### Option 2: Manual Setup

If the automated script doesn't work, follow these manual steps:

#### Step 1: Backend Setup (Maven)

```powershell
# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Navigate to backend and install dependencies
cd backend
mvn clean install -DskipTests -gs settings.xml -t toolchains.xml
cd ..
```

**Alternative using provided helper script:**
```cmd
cd backend
.\install-java17.ps1
cd ..
```

**Or using Node.js helper:**
```cmd
cd backend
node install.js
cd ..
```

#### Step 2: Frontend Setup (npm)

```powershell
cd frontend
npm install
cd ..
```

#### Step 3: Playwright Browsers (Optional but Recommended)

```powershell
cd frontend
npx playwright install
cd ..
```

Note: This step is required for running E2E tests with Playwright.

## Verification

After setup is complete, verify the installation:

### Backend
```powershell
cd backend

# Test compilation
mvn clean package -DskipTests

# Run unit tests
mvn test
```

### Frontend
```powershell
cd frontend

# Run linting (if configured)
npm run lint

# Run unit tests
npm test
```

## Common Issues

### Issue 1: JAVA_HOME not set correctly

**Symptom:**
```
The JAVA_HOME environment variable is not defined correctly
```

**Solution:**
Set JAVA_HOME before running Maven:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Issue 2: Maven proxy errors

**Symptom:**
```
Could not transfer artifact ... proxy: ProxyInfo{host='localhost', userName='null', port=8888...
```

**Solution:**
Use the provided `settings.xml` which bypasses proxy:
```cmd
mvn clean install -DskipTests -gs settings.xml
```

The `backend/settings.xml` file is configured to use Maven Central directly without proxy.

### Issue 3: Maven toolchains errors

**Solution:**
Use the provided `toolchains.xml`:
```cmd
mvn clean install -DskipTests -t toolchains.xml
```

Or ensure `~/.m2/toolchains.xml` (or `%USERPROFILE%\.m2\toolchains.xml` on Windows) is configured properly.

## Project Structure

```
/
├── backend/          # Spring Boot application
│   ├── src/         # Source code
│   ├── pom.xml      # Maven configuration
│   ├── settings.xml # Maven settings (no proxy)
│   └── toolchains.xml # Java 17 toolchain config
├── frontend/        # Angular application
│   ├── src/         # Source code
│   ├── e2e/         # Playwright E2E tests
│   └── package.json # npm configuration
├── infra/           # Docker infrastructure
└── setup-repo.cmd   # Automated setup script
```

## Next Steps

After successful setup:

1. **Start Infrastructure** (if needed):
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Run Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Run Frontend** (in another terminal):
   ```bash
   cd frontend
   npm start
   ```

4. **Run Tests**:
   - Backend: `cd backend && mvn test`
   - Frontend: `cd frontend && npm test`
   - E2E: `cd frontend && npm run e2e`

## Build Commands Reference

### Backend
- **Build**: `mvn clean package`
- **Test**: `mvn test`
- **Skip tests**: `mvn clean package -DskipTests`
- **Run**: `mvn spring-boot:run`
- **E2E (H2)**: `mvn verify -Pbackend-e2e-h2`
- **E2E (PostgreSQL)**: `mvn verify -Pbackend-e2e-postgres`

### Frontend
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`
- **Dev Server**: `npm start`
- **E2E**: `npm run e2e`
- **E2E (PostgreSQL)**: `npm run e2e:postgres`
- **E2E (All configs)**: `npm run e2e:full`

## Additional Resources

- See `AGENTS.md` for detailed development guide
- See `SETUP.md` for alternative setup methods
- See `backend/README.md` for backend-specific information
- See `frontend/README.md` for frontend-specific information
