# 🚀 Start Here - Repository Setup

Welcome! This repository has been cloned and is ready for initial setup.

## ⚡ Quick Start (< 5 minutes)

### Status Check

- ✅ Frontend dependencies installed (`npm install` complete)
- ⚠️ Backend setup required (Maven install needed)

### Complete Backend Setup Now

Open PowerShell in the repository root and run:

```powershell
cd backend
..\mvn17.ps1 clean install -DskipTests
```

**That's it!** This will download all Java dependencies and compile the Spring Boot application.

## 🎯 Alternative Setup Methods

### Option 1: Automated Script

```powershell
.\Initialize-Repository.ps1
```

### Option 2: Using Batch File

```cmd
cd backend
..\mvn17.cmd clean install -DskipTests
```

### Option 3: Manual JAVA_HOME

```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

## ✅ Verify Setup

After backend setup completes, verify:

```powershell
# Test backend
cd backend
..\mvn17.ps1 test

# Test frontend (already set up)
cd frontend
npm test
```

## 🏃 Run the Application

### Start Backend

```powershell
cd backend
..\mvn17.ps1 spring-boot:run
```

Runs on: `http://localhost:8080`

### Start Frontend

```powershell
cd frontend
npm start
```

Runs on: `http://localhost:4200`

## 📚 More Information

- **`SETUP_STATUS.md`**: Current setup status and detailed steps
- **`INITIAL_SETUP_INSTRUCTIONS.md`**: Complete setup guide with troubleshooting
- **`AGENTS.md`**: All development commands (build, test, lint, e2e)
- **`README.md`**: Project overview and architecture

## 🆘 Having Issues?

### "JAVA_HOME not defined correctly"

Use the provided wrappers:
- `mvn17.ps1` (PowerShell)
- `mvn17.cmd` (Command Prompt)

These automatically set JAVA_HOME to Java 17.

### "Cannot find mvn command"

Maven is installed at: `C:\Environement\maven-3.8.6`

Check it's in your PATH, or use the full path in mvn17.ps1 wrapper.

### Need More Help?

See `INITIAL_SETUP_INSTRUCTIONS.md` for:
- Detailed troubleshooting
- Alternative setup methods
- Common issues and solutions

---

**Ready to code!** Once backend setup is complete, you're all set for development.
