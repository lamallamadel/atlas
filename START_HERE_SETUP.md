# 🚀 Quick Start - Repository Setup

## Current Status

✅ **Frontend**: Fully configured and ready
⚠️ **Backend**: One setup script needs to be run manually

## Complete the Setup (1 minute)

Run this command in your terminal:

### Windows Command Prompt
```cmd
SETUP_BACKEND.cmd
```

### PowerShell
```powershell
.\SETUP_BACKEND.ps1
```

This will:
- Set Java 17 as the JDK
- Install all Maven dependencies
- Take 5-10 minutes on first run (downloads dependencies)

## What's Already Done

✅ Frontend npm dependencies installed (1,188 packages)
✅ Maven settings configured (no proxy, direct to Maven Central)
✅ Java 17 verified at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
✅ Maven 3.8.6 verified at `C:\Environement\maven-3.8.6`

## After Setup

### Start Development
```powershell
.\dev.ps1 up
```
This starts:
- Backend on http://localhost:8080
- Frontend on http://localhost:4200
- Infrastructure (Docker)

### Run Tests
```bash
# Backend tests
cd backend && mvn test

# Frontend tests
cd frontend && npm test

# E2E tests
cd backend && mvn verify -Pbackend-e2e-h2
cd frontend && npm run e2e
```

### Build
```bash
cd backend && mvn clean package
cd frontend && npm run build
```

## Documentation

- **AGENTS.md** - All commands and development guide
- **SETUP_STATUS.md** - Detailed setup status
- **INITIAL_SETUP_INSTRUCTIONS.md** - Complete setup instructions

## Need Help?

See `SETUP_STATUS.md` for troubleshooting and detailed information.

---

**Next step**: Run `SETUP_BACKEND.cmd` (Windows) or `.\SETUP_BACKEND.ps1` (PowerShell)
