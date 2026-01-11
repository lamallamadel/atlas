# 🚀 Start Here - Initial Setup After Clone

Welcome! You've just cloned the repository. This guide will help you complete the initial setup.

## ⚡ Quick Start (TL;DR)

Run this command to complete setup:

```cmd
COMPLETE_INITIAL_SETUP.cmd
```

Or in PowerShell:

```powershell
.\COMPLETE_INITIAL_SETUP.ps1
```

This will:
1. Set JAVA_HOME to Java 17
2. Install backend dependencies (Maven)
3. Install Playwright browsers for E2E tests

## 📋 What's Already Done

✅ **Frontend Dependencies**: All npm packages installed (1,178 packages)  
✅ **Configuration Files**: Maven toolchains and settings configured  
✅ **Repository**: Cloned and ready

## ⏳ What Needs to Be Completed

### 1. Backend Dependencies (Required)
Maven dependencies need to be installed with Java 17.

**Why not done yet?** The automated setup couldn't modify environment variables due to security restrictions.

### 2. Playwright Browsers (Required for E2E tests)
Browser binaries for Chromium, Firefox, and WebKit need to be installed.

## 🛠️ Complete the Setup

### Option 1: Automated Script (Recommended)

**Windows Command Prompt:**
```cmd
COMPLETE_INITIAL_SETUP.cmd
```

**PowerShell:**
```powershell
.\COMPLETE_INITIAL_SETUP.ps1
```

### Option 2: Manual Steps

If the script doesn't work, run these commands:

**Step 1 - Backend Dependencies:**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -DskipTests
cd ..
```

**Step 2 - Playwright Browsers:**
```cmd
cd frontend
npm run install-browsers
cd ..
```

## ✅ Verify Setup

After running the setup, verify it worked:

```cmd
REM Check Java version (should show 17.x.x)
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
java -version

REM Check backend build
cd backend
mvn -version
mvn test
cd ..

REM Check frontend
cd frontend
npm run e2e:fast
cd ..
```

## 🎯 After Setup - Development Commands

Once setup is complete, use these commands for development:

### Backend

```cmd
cd backend

# Run dev server (with auto-reload)
mvn spring-boot:run

# Build
mvn clean package

# Run tests
mvn test

# Run E2E tests
mvn verify -Pbackend-e2e-h2
```

### Frontend

```cmd
cd frontend

# Run dev server (with auto-reload)
npm start

# Build
npm run build

# Run unit tests
npm test

# Run E2E tests
npm run e2e
```

### Infrastructure (Optional)

```cmd
cd infra

# Start PostgreSQL and other services
docker-compose up -d

# Stop services
docker-compose down
```

## 📚 Additional Documentation

- **AGENTS.md**: Complete development guide with all commands
- **SETUP.md**: Detailed setup instructions and troubleshooting
- **README.md**: Project overview and architecture
- **INITIAL_SETUP_STATUS.md**: Detailed status of what was completed

## 🔧 Troubleshooting

### "JAVA_HOME is not defined correctly"

Maven requires Java 17. Set it before running Maven commands:

```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
```

### Maven build fails with network errors

Check your network connection. Maven needs to download dependencies from Maven Central.

If behind a proxy, update `backend/settings.xml`:

```xml
<proxies>
  <proxy>
    <id>my-proxy</id>
    <active>true</active>
    <protocol>http</protocol>
    <host>proxy.example.com</host>
    <port>8080</port>
  </proxy>
</proxies>
```

### Playwright installation fails

Ensure npm installed correctly first:

```cmd
cd frontend
npm install
npm run install-browsers
```

## 🎓 Tech Stack

- **Backend**: Spring Boot 3.2.1 + Java 17 + Maven
- **Frontend**: Angular 16 + TypeScript + npm
- **Testing**: JUnit 5, Playwright, Testcontainers
- **Database**: PostgreSQL (prod), H2 (tests)
- **Infrastructure**: Docker Compose

## 🚦 Next Steps

1. ✅ Run `COMPLETE_INITIAL_SETUP.cmd` or `.\COMPLETE_INITIAL_SETUP.ps1`
2. ✅ Verify backend: `cd backend && mvn test`
3. ✅ Verify frontend: `cd frontend && npm test`
4. 📖 Read `AGENTS.md` for complete development workflow
5. 🏗️ Start infrastructure: `cd infra && docker-compose up -d` (optional)
6. 🚀 Start coding!

## 📞 Getting Help

- Check `AGENTS.md` for command reference
- Check `SETUP.md` for detailed setup instructions
- Check `INITIAL_SETUP_STATUS.md` for current status
- Review error messages - they usually point to the issue

---

**Ready?** Run `COMPLETE_INITIAL_SETUP.cmd` or `.\COMPLETE_INITIAL_SETUP.ps1` to complete the setup! 🚀
