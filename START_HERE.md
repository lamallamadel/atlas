# 🚀 Start Here - Quick Setup Guide

Welcome to the repository! Follow these steps to get started.

## Current Status

✅ **Frontend**: Fully set up and ready  
⚠️ **Backend**: One command needed to complete setup

## Complete Setup (One Command)

Run this command from the repository root:

```cmd
.\complete-backend-setup.bat
```

This will:
- Set Java 17 environment  
- Configure Maven settings (bypass proxy)
- Install all backend dependencies
- Takes ~2-5 minutes depending on internet speed

## Start Development

After running the setup command above:

### 1. Start Backend
```powershell
cd backend
mvn spring-boot:run
```
✅ Backend API: http://localhost:8080

### 2. Start Frontend (new terminal)
```powershell
cd frontend
npm start
```
✅ Frontend App: http://localhost:4200

## Optional: E2E Testing Setup

To run end-to-end tests, install Playwright browsers:

```powershell
cd frontend
npx playwright install
```

Then run tests:
```powershell
npm run e2e:fast
```

## Verify Setup

Check that everything works:

```powershell
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```

## Tech Stack

- **Backend**: Spring Boot 3.2.1 + Java 17 + Maven
- **Frontend**: Angular 16 + TypeScript 5.1 + npm
- **Database**: PostgreSQL (Docker) or H2 (in-memory)
- **Testing**: JUnit 5 (backend), Jasmine/Karma (frontend unit), Playwright (E2E)

## Common Commands

### Backend
```powershell
mvn test                    # Run tests
mvn spring-boot:run         # Start server
mvn clean package           # Build JAR
```

### Frontend
```powershell
npm start                   # Dev server
npm test                    # Unit tests
npm run build               # Production build
npm run e2e                 # E2E tests
```

## Need Help?

- **Setup Issues**: See [INITIAL_SETUP_COMPLETE.md](./INITIAL_SETUP_COMPLETE.md)
- **Development Guide**: See [AGENTS.md](./AGENTS.md)
- **Troubleshooting**: See [SETUP_COMPLETED.md](./SETUP_COMPLETED.md)

## Troubleshooting

### "Maven proxy error"
→ Run `.\complete-backend-setup.bat` - it fixes proxy config

### "Java 8 detected but 17 required"
→ The setup script sets Java 17 automatically

### "Port 8080 already in use"
→ Stop other services on port 8080 or change port in `backend/src/main/resources/application.yml`

---

**Ready?** Run `.\complete-backend-setup.bat` to complete setup! 🎉
