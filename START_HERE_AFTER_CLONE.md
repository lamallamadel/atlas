# Initial Setup - Start Here

This is a newly cloned repository. To complete the initial setup, you need to install dependencies for both the backend and frontend.

## What's Been Prepared

The repository has been prepared with setup scripts and configurations:

✅ Maven toolchains configuration (`backend/toolchains.xml`) - configured for Java 17  
✅ Maven wrapper script (`backend/mvn17.cmd`) - automatically sets Java 17  
✅ Setup scripts created:
   - `SETUP.ps1` - PowerShell setup script  
   - `SETUP.cmd` - Batch file setup script  
   - `setup.js` - Node.js setup script  

## Quick Setup (Choose One Method)

### Method 1: PowerShell (Recommended)

Open PowerShell in the repository root and run:

```powershell
.\SETUP.ps1
```

### Method 2: Command Prompt

Open Command Prompt in the repository root and run:

```cmd
SETUP.cmd
```

### Method 3: Node.js

If you have Node.js installed:

```cmd
node setup.js
```

### Method 4: Manual Setup

If the automated scripts don't work, follow these steps:

#### Backend Setup

```powershell
# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Install backend dependencies
cd backend
mvn clean install -DskipTests
cd ..
```

#### Frontend Setup

```powershell
# Install frontend dependencies
cd frontend
npm install

# Install Playwright browsers for E2E tests
npx playwright install
cd ..
```

## What Gets Installed

- **Backend**: Maven downloads all Java dependencies (~200MB, first time only)
- **Frontend**: npm installs all Node.js packages (~500MB)
- **Playwright**: Browser binaries for E2E testing (~500MB)

**Total time**: 5-15 minutes depending on internet speed

## Verification

After setup completes, verify everything works:

### Test Backend
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn test
```

### Test Frontend E2E (Fast mode)
```powershell
cd frontend
npm run e2e:fast
```

## Next Steps

Once setup is complete:

- **Start backend dev server**: `cd backend && mvn spring-boot:run`
- **Run backend tests**: `cd backend && mvn test`  
- **Run backend E2E tests (H2)**: `cd backend && mvn verify -Pbackend-e2e-h2`
- **Run frontend E2E tests**: `cd frontend && npm run e2e`
- **Run all E2E tests**: `cd frontend && npm run e2e:full`

See `AGENTS.md` for complete command reference and testing options.

## Troubleshooting

### "JAVA_HOME not defined correctly"

Make sure Java 17 is installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot`.

If it's installed elsewhere, update the path in:
- `backend/toolchains.xml`
- `backend/mvn17.cmd`
- Setup scripts (`SETUP.ps1`, `SETUP.cmd`, `setup.js`)

### Maven download issues

If Maven fails to download dependencies, check your internet connection and proxy settings.

### npm install fails

Make sure you have Node.js 16+ and npm 8+ installed:
```
node --version
npm --version
```

## Documentation

- `AGENTS.md` - Complete command reference and development guide
- `SETUP.md` - Detailed setup instructions  
- `SETUP_INSTRUCTIONS_MANUAL.md` - Step-by-step manual setup guide
- `README.md` - Project overview

---

**Ready to start?** Run one of the setup scripts above and you'll be ready to develop in minutes!
