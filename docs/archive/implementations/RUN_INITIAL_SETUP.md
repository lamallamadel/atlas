# Initial Repository Setup - Run These Commands

This repository has been cloned and is ready for setup. Due to security restrictions, the automated setup cannot modify environment variables or run scripts. Please run ONE of the following options:

## Option 1: Use the Existing Setup Script (RECOMMENDED)

Simply run the existing setup script:

```cmd
COMPLETE-SETUP.cmd
```

This script will:
- Set JAVA_HOME to Java 17
- Build the backend with Maven
- The script handles everything automatically

## Option 2: Manual Setup Commands

If you prefer to run commands manually:

### Backend Setup

```cmd
REM Set Java 17 for this PowerShell session
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

REM Build backend
cd backend
mvn clean install -DskipTests
cd ..
```

### Frontend Setup

```cmd
cd frontend
npm install
cd ..
```

## Option 3: Use the Maven Wrapper

The repository includes `mvn17.cmd` and `mvn17.ps1` wrappers that automatically set JAVA_HOME:

```cmd
REM Build backend using wrapper
cd backend
..\mvn17.cmd clean install -DskipTests
cd ..

REM Install frontend
cd frontend
npm install
cd ..
```

## Verify Setup

After running the setup, verify everything is ready:

```cmd
REM Check backend build
dir backend\target\backend*.jar

REM Check frontend dependencies
dir frontend\node_modules
```

## What Gets Installed

### Backend (`backend/`)
- Maven dependencies (Spring Boot, validation, actuator, etc.)
- Compiled Java classes
- Built JAR file in `backend/target/`

### Frontend (`frontend/`)
- Node modules (Angular, Material, Chart.js, Playwright, etc.)
- Development dependencies

## Next Steps

Once setup is complete, you can:

1. **Run backend tests**: `cd backend && mvn test`
2. **Run frontend tests**: `cd frontend && npm test`
3. **Build backend**: `cd backend && mvn clean package`
4. **Start backend**: `cd backend && mvn spring-boot:run`
5. **Start frontend**: `cd frontend && npm start`
6. **Run E2E tests**: `cd frontend && npm run e2e`

## Troubleshooting

### Java Version Error
If you see "Java version X is not supported", ensure JAVA_HOME points to Java 17:
```cmd
echo %JAVA_HOME%
REM Should output: C:\Environement\Java\jdk-17.0.5.8-hotspot
```

### Maven Not Found
If Maven is not in PATH, use the absolute path:
```cmd
C:\Environement\maven-3.8.6\bin\mvn.cmd --version
```

### Node/NPM Not Found
Ensure Node.js is installed and in PATH:
```cmd
node --version
npm --version
```

## Environment Info

- **Java 17 Location**: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- **Maven Location**: `C:\Environement\maven-3.8.6`
- **Java 17 Available**: ✓ (detected at specified location)
- **Maven Toolchains**: ✓ (configured in `toolchains.xml`)
