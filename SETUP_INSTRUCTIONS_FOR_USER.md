# Initial Setup Instructions

This repository requires both backend (Java/Maven) and frontend (Node.js/npm) setup.

## Prerequisites Check

Before proceeding, ensure you have:
- Java 17 (JDK 17.0.5.8 or later)
- Maven 3.6+
- Node.js 18+ and npm
- Docker & Docker Compose (optional, for infrastructure)

## Setup Steps

Due to security restrictions in the automated environment, please run the following commands manually:

### Step 1: Frontend Setup (Angular)

```powershell
cd frontend
npm install
cd ..
```

This will install all Node.js dependencies for the Angular frontend application.

### Step 2: Backend Setup (Spring Boot)

The backend requires Java 17. Choose one of the following methods:

#### Option A: Using the provided Node.js script (Recommended)
```powershell
node backend\install.js
```

#### Option B: Using PowerShell script
```powershell
.\backend\build-with-java17.ps1
```

#### Option C: Using batch file
```cmd
.\backend\setup.cmd
```

#### Option D: Manual setup
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
cd ..
```

## Verification

After running both setups, you should be able to run:

### Frontend
- Build: `cd frontend && npm run build`
- Test: `cd frontend && npm test`
- Lint: `cd frontend && npm run lint`
- Dev server: `cd frontend && npm start`

### Backend
- Build: `cd backend && mvn clean package`
- Test: `cd backend && mvn test`
- Dev server: `cd backend && mvn spring-boot:run`

## Infrastructure (Optional)

To start local Docker services:
```powershell
cd infra
docker-compose up -d
```

## Notes

- The frontend installation will create a `node_modules` directory with approximately 1,180 packages
- The backend installation will create a `target` directory with compiled artifacts
- Both `node_modules` and `target` are already in `.gitignore`
- If you encounter Java version issues, ensure JAVA_HOME is set correctly before running Maven commands
