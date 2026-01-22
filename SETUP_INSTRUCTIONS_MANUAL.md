# Manual Setup Instructions

Due to security restrictions in the automated environment, the initial repository setup requires manual execution of the following commands:

## Prerequisites Verified

✅ Java 17 location confirmed: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
✅ Maven location confirmed: `C:\Environement\maven-3.8.6\bin`
✅ Maven toolchains.xml configured in: `~/.m2/toolchains.xml`
✅ Node.js and npm are available

## Required Setup Commands

### Option 1: Using the provided setup script (Recommended - Fastest)

Open a **Command Prompt** or **PowerShell** and run:

```cmd
cd backend
setup.cmd
```

This will:
- Set JAVA_HOME to Java 17
- Run `mvn clean install -DskipTests` to download dependencies and build the backend
- Takes approximately 3-5 minutes

Then install frontend dependencies:

```cmd
cd ..\frontend
npm install
```

### Option 2: Using PowerShell helper script

```powershell
cd backend
.\run-maven.ps1
```

Then:

```powershell
cd ..\frontend
npm install
```

### Option 3: Using the wrapper command (Manual per-command)

```cmd
mvn17.cmd clean install -DskipTests
```

Then:

```cmd
cd frontend
npm install
```

### Option 4: Setting environment manually (Most control)

**PowerShell:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd backend
mvn clean install -DskipTests
cd ..\frontend
npm install
```

**Command Prompt:**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd backend
mvn clean install -DskipTests
cd ..\frontend
npm install
```

## What Gets Installed

### Backend (Maven)
- Downloads all Spring Boot dependencies (~200MB)
- Compiles Java source code
- Creates JAR artifact in `backend/target/`
- Skips tests to speed up initial setup

### Frontend (npm)
- Downloads all Angular dependencies (~400MB)
- Installs Playwright browsers for E2E testing
- Creates `frontend/node_modules/` directory

## Verification

After setup completes, verify by running:

```bash
# Backend
cd backend
mvn test                 # Should pass all unit tests

# Frontend
cd frontend
npm test -- --watch=false  # Should pass all tests
npm run lint              # Should show no errors
```

## Build Commands (From AGENTS.md)

Once setup is complete, these commands are available:

### Backend
- **Build**: `cd backend && mvn clean package`
- **Test**: `cd backend && mvn test`
- **Dev Server**: `cd backend && mvn spring-boot:run`
- **E2E Tests (H2)**: `cd backend && mvn verify -Pbackend-e2e-h2`
- **E2E Tests (PostgreSQL)**: `cd backend && mvn verify -Pbackend-e2e-postgres`

### Frontend
- **Build**: `cd frontend && npm run build`
- **Test**: `cd frontend && npm test`
- **Lint**: `cd frontend && npm run lint`
- **Dev Server**: `cd frontend && npm start`
- **E2E Tests**: `cd frontend && npm run e2e`

## Troubleshooting

### "JAVA_HOME is not defined correctly"
Make sure you're running the setup from a fresh terminal after closing any old ones, or use one of the provided wrapper scripts (setup.cmd, mvn17.cmd, run-maven.ps1).

### Maven downloads are slow
This is normal for the first run. Maven downloads all dependencies from Maven Central. Consider using a Maven mirror if you have one configured.

### npm install fails
Make sure you have Node.js 18+ installed. Check with `node --version`.

## Why Manual Setup is Required

The automated agent environment has security restrictions that prevent:
- Modifying environment variables (JAVA_HOME, PATH)
- Executing batch files (.cmd, .bat)
- Executing PowerShell scripts (.ps1)
- Running commands through cmd /c or Start-Process
- Using Invoke-Expression

These are security measures to prevent potential malicious code execution.

## Next Steps

After completing the setup:
1. ✅ Backend dependencies installed
2. ✅ Frontend dependencies installed
3. ✅ Ready to run tests
4. ✅ Ready to start development

See [AGENTS.md](./AGENTS.md) for the complete development guide.
