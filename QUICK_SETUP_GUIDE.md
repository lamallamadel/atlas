# Quick Setup Guide

## Current Status

✅ **Frontend**: Ready (npm packages installed)  
⚠️ **Backend**: Requires one command to complete

## Complete Setup Now

Run this command to finish setup:

```cmd
cd backend
setup-maven-install.cmd
```

**That's it!** This will:
- Set Java 17 environment
- Download all Maven dependencies
- Build the backend
- Run tests to verify

Takes ~5-10 minutes on first run.

## Optional: E2E Tests

If you need to run E2E tests:

```bash
cd frontend
npx playwright install
```

## Verify Everything Works

```bash
# Test backend
cd backend
mvn test

# Test frontend
cd frontend
npm run test
```

## Start Developing

```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend  
cd frontend
npm start
```

Backend: http://localhost:8080  
Frontend: http://localhost:4200

---

**Need help?** See:
- `SETUP_COMPLETE_NEXT_STEPS.md` - Detailed instructions
- `SETUP_STATUS.md` - Full setup status
- `AGENTS.md` - All available commands
