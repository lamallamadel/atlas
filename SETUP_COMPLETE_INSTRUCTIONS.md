# Repository Initial Setup - Completion Instructions

## What Has Been Done

✅ **Frontend Setup - COMPLETE**
- Installed all npm dependencies (`npm install` in frontend directory)
- Installed Playwright browsers for E2E testing (`npx playwright install`)
- All frontend dependencies are ready to use

✅ **Configuration Files - READY**
- Maven toolchains configured with Java 17 path
- Maven settings.xml configured to bypass proxies
- All configuration files are in place

✅ **Helper Scripts - CREATED**
- `COMPLETE_SETUP.cmd` - Complete backend setup in one command
- `SETUP_BACKEND.ps1` - PowerShell script for backend setup
- `START_HERE.md` - Quick start guide
- Various Maven wrapper scripts in backend directory

## What You Need to Do

⚠️ **Backend Maven Build - ACTION REQUIRED**

Due to security restrictions in the automated setup environment, the Maven build for the backend could not be executed automatically. You need to run it manually once.

### Simple: Just Run This Command

From the repository root, execute:

```cmd
COMPLETE_SETUP.cmd
```

This will:
1. Set JAVA_HOME to Java 17
2. Navigate to the backend directory  
3. Run `mvn clean install` with proper configuration
4. Report success or failure

**That's it!** After this completes, your repository will be fully set up.

## Alternative Methods

If the above doesn't work, try one of these:

### Method 2: PowerShell Script
```powershell
.\SETUP_BACKEND.ps1
```

### Method 3: Direct Maven Command
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install --toolchains ..\toolchains.xml --settings settings.xml
```

### Method 4: Use Maven Wrapper
```cmd
cd backend
mvn.cmd clean install -s settings.xml
```

## Verification

After running the backend setup, verify it worked:

```powershell
# Check if backend JAR was built
Test-Path backend\target\backend.jar
# Should return: True
```

## After Setup Complete

You're ready to develop! Here are the key commands:

### Start Development Servers

**Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Frontend (in separate terminal):**
```bash
cd frontend
npm start
```

**Access:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html
- Health Check: http://localhost:8080/actuator/health

### Run Tests

**Backend:**
```bash
cd backend
mvn test                          # Unit tests
mvn verify -Pbackend-e2e-h2      # E2E tests with H2
mvn verify -Pbackend-e2e-postgres # E2E tests with PostgreSQL
```

**Frontend:**
```bash
cd frontend
npm test           # Unit tests
npm run lint       # Linting
npm run e2e        # E2E tests (H2 + mock auth)
npm run e2e:fast   # Fast E2E tests (single browser)
npm run e2e:ui     # E2E tests in UI mode
```

### Build for Production

**Backend:**
```bash
cd backend
mvn clean package
# Output: backend/target/backend.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

## Infrastructure

To start Docker services (PostgreSQL, etc.):

```bash
cd infra
docker-compose up -d
```

To stop services:

```bash
cd infra
docker-compose down
```

## Documentation

- **AGENTS.md** - Complete development guide (commands, architecture, troubleshooting)
- **START_HERE.md** - Quick start guide
- **INITIAL_SETUP_STATUS.md** - Detailed setup status and verification
- **README.md** - Project overview

## Troubleshooting

### "JAVA_HOME is not defined correctly"
Make sure Java 17 is installed at: `C:\Environement\Java\jdk-17.0.5.8-hotspot`

Verify with:
```powershell
Test-Path C:\Environement\Java\jdk-17.0.5.8-hotspot
```

### Maven Build Fails - Network/Proxy Issues
The `backend/settings.xml` is configured to bypass proxies. If you still have issues:
1. Check your internet connection
2. Verify `backend/settings.xml` contains the Maven Central mirror configuration
3. Try running with: `mvn clean install -s settings.xml -X` (debug mode)

### Port Already in Use
If you get port conflict errors:
- Backend uses port 8080
- Frontend uses port 4200
- PostgreSQL uses port 5432

Check what's using a port:
```powershell
Get-NetTCPConnection -LocalPort 8080
```

## Need More Help?

1. Check `AGENTS.md` for comprehensive development guide
2. Check `INITIAL_SETUP_STATUS.md` for detailed setup information
3. Review the error messages - they usually indicate what's wrong
4. Verify Java 17 and Maven are properly installed

## Summary

✅ Frontend: **Ready to use**
⚠️ Backend: **Run `COMPLETE_SETUP.cmd` to finish**

That's all you need to do!
