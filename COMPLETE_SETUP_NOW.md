# 🚀 Complete Backend Setup - Quick Guide

The frontend is ready. Backend needs one command:

## Windows PowerShell (Recommended)
```powershell
.\backend\run-maven.ps1
```

## Windows Command Prompt
```cmd
.\run-maven-setup.cmd
```

## Manual (Any Shell)
```powershell
# Set Java 17
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Install backend dependencies
cd backend
mvn clean install -DskipTests
cd ..
```

## After Setup is Complete

### Run Tests
```bash
cd backend && mvn test
cd frontend && npm test
```

### Build
```bash
cd backend && mvn clean package
cd frontend && npm run build
```

### Start Development
```bash
cd frontend && npm start  # Frontend at http://localhost:4200
cd backend && mvn spring-boot:run  # Backend at http://localhost:8080
```

---

**Current Status:**
- ✅ Frontend: Ready (1180 packages installed)
- ⏳ Backend: Needs Java 17 setup (one command above)
- ✅ Helper scripts: Created and ready
