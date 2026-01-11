# 🚀 Start Here - Just Cloned the Repository

Welcome! You've just cloned the repository. Here's what you need to do to get started.

---

## Current Status

✅ **Frontend**: Ready to use immediately (dependencies installed)  
⚠️ **Backend**: Needs one command (2 minutes)

---

## Quick Setup (2 minutes)

### Step 1: Backend Dependencies

Open a terminal and run **ONE** of these commands:

**Windows Command Prompt:**
```cmd
cd backend
setup.cmd
```

**PowerShell:**
```powershell
cd backend
.\run-maven.ps1
```

**What happens:** Downloads Maven dependencies and builds the Spring Boot app (takes 2-3 minutes)

### Step 2: Start Development

**Option A - Start Everything:**
```powershell
.\dev.ps1 up
```

**Option B - Start Individually:**

Terminal 1 (Backend):
```powershell
cd backend
mvn spring-boot:run
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm start
```

### Step 3: Access the App

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui

---

## Optional: E2E Testing Setup

If you want to run end-to-end tests, install Playwright browsers:

```powershell
cd frontend
npx playwright install
```

Takes 2-3 minutes. Skip this if you don't need E2E tests yet.

---

## What's Already Done

✅ Frontend npm packages installed (1,177 packages)  
✅ All configuration files in place  
✅ Helper scripts created  
✅ Git repository ready  

---

## Common Commands

### Development
```powershell
# Backend
cd backend
mvn spring-boot:run    # Start server
mvn test              # Run tests

# Frontend  
cd frontend
npm start             # Start dev server
npm test              # Run tests
npm run lint          # Lint code
```

### Testing
```powershell
# Backend E2E (H2)
cd backend
mvn verify -Pbackend-e2e-h2

# Frontend E2E
cd frontend
npm run e2e           # Default config
npm run e2e:fast      # Fast mode
```

### Build
```powershell
# Backend
cd backend
mvn clean package     # Creates backend/target/backend.jar

# Frontend
cd frontend
npm run build         # Creates frontend/dist/
```

---

## Need Help?

- **Complete Guide**: See [AGENTS.md](AGENTS.md)
- **Setup Details**: See [SETUP_STATUS.md](SETUP_STATUS.md)  
- **Full README**: See [README.md](README.md)

---

**TL;DR:** Run `cd backend && setup.cmd` then you're ready to develop! 🎉
