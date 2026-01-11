# Quick Start Guide

## Setup Complete! ✅

The repository has been set up and is ready for development.

### One Manual Step Required

Install Playwright browsers for E2E testing:

```powershell
cd frontend
npx playwright install
```

---

## Development Commands

### Backend (Spring Boot)

```powershell
# Build
backend\mvn.cmd -f backend\pom.xml clean package

# Run
backend\mvn.cmd -f backend\pom.xml spring-boot:run

# Test
backend\mvn.cmd -f backend\pom.xml test

# E2E Tests (H2)
backend\mvn.cmd -f backend\pom.xml verify -Pbackend-e2e-h2
```

### Frontend (Angular)

```powershell
cd frontend

# Build
npm run build

# Run dev server (http://localhost:4200)
npm start

# Test
npm test

# E2E Tests
npm run e2e
```

---

## What Was Installed

### Backend ✅
- Maven dependencies (all resolved)
- Spring Boot 3.2.1 + Java 17
- Build output: `backend/target/backend.jar`

### Frontend ✅
- Node modules (1177 packages)
- Angular 16.2.0
- Angular Material, Chart.js, etc.

### Not Yet Installed ⚠️
- Playwright browsers (manual step required)

---

## Verify Setup

```powershell
# Check Java/Maven
backend\mvn.cmd -v

# Check Node/npm
npm -v

# Check build artifacts
ls backend/target/backend.jar
ls frontend/node_modules
```

---

For detailed information, see:
- **INITIAL_SETUP_STATUS.md** - Status summary
- **SETUP_COMPLETE.md** - Detailed setup information
- **AGENTS.md** - Full development guide
