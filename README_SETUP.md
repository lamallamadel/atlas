# Repository Setup

## 🚀 Quick Start (New Clone)

This repository has been prepared but dependencies need to be installed. Run ONE of these commands:

### Windows PowerShell (Recommended)
```powershell
.\SETUP.ps1
```

### Windows Command Prompt
```cmd
SETUP.cmd
```

### Node.js (Any Platform)
```bash
node setup.js
```

## ⏱️ Setup Time

- First time: 10-20 minutes (downloads ~1GB of dependencies)
- Subsequent builds: < 1 minute

## 📋 What Gets Installed

- **Backend**: Maven dependencies for Spring Boot application
- **Frontend**: npm packages for Angular application
- **Playwright**: Browser binaries for E2E testing

## ✅ After Setup

Run these commands to verify:

```bash
# Backend tests
cd backend
mvn test

# Frontend E2E tests (fast mode)
cd frontend
npm run e2e:fast
```

## 📚 Documentation

- **START_HERE_AFTER_CLONE.md** - Detailed setup guide with troubleshooting
- **SETUP_INSTRUCTIONS_MANUAL.md** - Manual setup steps
- **AGENTS.md** - Complete development guide with all commands
- **INITIAL_SETUP_STATUS.md** - Current setup status

## ⚙️ Requirements

- Java 17 (JDK 17.0.5.8+)
- Maven 3.6+
- Node.js 16+
- Docker (for PostgreSQL E2E tests)

## 🎯 Development Commands

After setup completes:

```bash
# Backend
cd backend
mvn spring-boot:run              # Start dev server
mvn test                         # Run unit tests
mvn verify -Pbackend-e2e-h2      # Run E2E tests with H2
mvn verify -Pbackend-e2e-postgres # Run E2E tests with PostgreSQL

# Frontend
cd frontend
npm run e2e                      # Run E2E tests (H2 + mock auth)
npm run e2e:fast                 # Run E2E tests (fast, single browser)
npm run e2e:full                 # Run all E2E test configurations
```

See **AGENTS.md** for complete command reference.
