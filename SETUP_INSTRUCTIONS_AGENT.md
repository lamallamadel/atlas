# Repository Setup - Unable to Complete Automatically

## Issue

The system security policy prevents automatic execution of the setup scripts because they require modifying environment variables (specifically `JAVA_HOME`). 

## Manual Setup Required

To set up this repository, please run ONE of the following commands manually in your PowerShell terminal:

### Option 1: Using the Node.js script (Recommended)
```powershell
node backend\install.js
```

### Option 2: Using the PowerShell script  
```powershell
.\backend\build-java17.ps1
```

### Option 3: Using the CMD wrapper
```cmd
cd backend
mvn-java17.cmd clean install -DskipTests
```

### Option 4: Manual setup
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
cd ..
cd frontend
npm install
```

## What Needs to Be Done

1. **Backend (Maven)**: Install Java dependencies
   - Requires Java 17
   - Command: `mvn clean install -DskipTests`
   
2. **Frontend (npm)**: Install Node.js dependencies  
   - Command: `npm install`

## After Setup

Once setup is complete, you can:
- **Build**: `cd backend && mvn clean package` and `cd frontend && npm run build`
- **Test**: `cd backend && mvn test` and `cd frontend && npm test`
- **Run**: Use `.\dev.ps1 up` or the Makefile commands

## Available Helper Scripts

The repository includes several helper scripts that handle the Java 17 requirement:
- `backend/mvn-java17.cmd` - CMD wrapper for Maven with Java 17
- `backend/build-java17.ps1` - PowerShell build script
- `backend/install.js` - Node.js installation script
- `dev.ps1` - Full development stack management

All of these scripts are configured to use Java 17 from: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
