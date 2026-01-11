# Initial Repository Setup - README

## 📋 Summary

This repository has been **partially set up** after cloning. The frontend is ready, but the backend requires one manual command.

## ✅ What's Complete

1. **Frontend Dependencies**: Installed (1,178 npm packages)
2. **Helper Scripts**: Created for easy backend setup
3. **Documentation**: Complete setup guides created

## ⚠️ What You Need to Do

### Complete Backend Setup (Required)

Run this ONE command from the repository root:

```cmd
backend\run-mvn-with-java17.cmd clean install -DskipTests -gs settings.xml
```

**What this does:**
- Sets Java 17 environment automatically
- Downloads Maven dependencies
- Compiles and packages the backend
- Creates `backend/target/backend.jar`

**Time:** 3-5 minutes  
**Size:** ~100MB of dependencies

### Verify Success

```cmd
dir backend\target\backend.jar
```

You should see a JAR file (~50-60 MB).

## 🚀 After Setup

### Start Development

**Terminal 1 - Backend:**
```cmd
cd backend
run-mvn-with-java17.cmd spring-boot:run
```
Access: http://localhost:8080

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm start
```
Access: http://localhost:4200

### Run Tests

```cmd
# Backend tests
cd backend
run-mvn-with-java17.cmd test

# Frontend tests
cd frontend
npm test
```

## 📚 Documentation

- **START_HERE_INITIAL_SETUP.md** ← Start here! 
- **QUICKSTART_AFTER_CLONE.md** - Quick command reference
- **SETUP_STATUS_FINAL_AFTER_CLONE.md** - Detailed status
- **AGENTS.md** - Complete development guide

## 🛠️ Tech Stack

- **Backend**: Java 17, Spring Boot 3.2.1, Maven
- **Frontend**: Angular 16, TypeScript, npm
- **Database**: PostgreSQL (production), H2 (testing)
- **Testing**: JUnit, Playwright

## ❓ Help

**Issue**: "JAVA_HOME environment variable is not defined correctly"  
**Fix**: Use the provided helper script `backend\run-mvn-with-java17.cmd`

**Issue**: Build fails  
**Fix**: Ensure you have internet connectivity (Maven downloads dependencies)

**Issue**: Command not found  
**Fix**: Run commands from the repository root directory

## 📁 Project Structure

```
.
├── backend/                 # Spring Boot application
│   ├── src/                # Java source code
│   ├── pom.xml            # Maven configuration
│   └── run-mvn-with-java17.cmd  # Helper script
├── frontend/               # Angular application
│   ├── src/               # TypeScript source code
│   ├── node_modules/      # ✅ Installed dependencies
│   └── package.json       # npm configuration
├── infra/                 # Docker infrastructure
└── docs/                  # Additional documentation
```

## 🎯 Next Steps

1. ✅ Read this file
2. ⚠️ Run backend setup command (see above)
3. ✅ Verify setup success
4. ✅ Read **AGENTS.md** for development workflow
5. ✅ Start building!
