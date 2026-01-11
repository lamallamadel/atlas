# 🚀 Start Here - Initial Setup After Clone

## Current Status

### ✅ Already Done
- **Frontend npm packages**: Installed (684 packages including Angular & Playwright)
- **Configuration files**: All configured (Java 17 toolchain, Maven settings)
- **Project structure**: Ready

### ⏱️ Quick Setup (5-7 minutes)

Run this script to complete setup:

```powershell
.\COMPLETE_INITIAL_SETUP.ps1
```

This will:
1. Install backend Maven dependencies (~3-5 min)
2. Install Playwright browsers (~1-2 min)

### ✓ Done!

After the script completes, you're ready to:

```powershell
# Start backend (port 8080)
cd backend
mvn spring-boot:run

# Start frontend (port 4200)  
cd frontend
npm start

# Run tests
cd backend && mvn test
cd frontend && npm run e2e
```

## Alternative: Manual Setup

If you prefer individual commands:

```powershell
# Step 1: Backend dependencies
cd backend
.\install-java17.ps1

# Step 2: Playwright browsers
cd frontend
npm run install-browsers
```

## Documentation

- **[AGENTS.md](./AGENTS.md)** - Complete command reference & development guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[README.md](./README.md)** - Project overview

## Tech Stack

- **Backend**: Spring Boot 3.2.1 + Java 17 + Maven
- **Frontend**: Angular 16 + TypeScript + Material Design
- **Testing**: JUnit 5, Playwright, Karma/Jasmine
- **Database**: H2 (dev), PostgreSQL (prod)
- **Infrastructure**: Docker Compose

## Need Help?

See troubleshooting sections in:
- `AGENTS.md` (lines 266-500)
- `README.md` (Troubleshooting section)
