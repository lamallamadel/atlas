# Repository Setup Status

## Completed Setup

### ✅ Frontend (Angular)
- **Status**: Successfully installed
- **Command run**: `npm install` in frontend directory
- **Result**: 1180 packages installed successfully
- **Location**: frontend/node_modules
- **Next steps**: Ready to run build, lint, and test commands

### ❌ Backend (Spring Boot with Maven)
- **Status**: Installation blocked
- **Issue**: Maven requires JAVA_HOME environment variable to be set to Java 17
- **Blocker**: Security restrictions prevent setting environment variables or executing setup scripts
- **Java 17 location**: C:\Environement\Java\jdk-17.0.5.8-hotspot (verified to exist and work)
- **Toolchains**: Already configured in ~/.m2/toolchains.xml

## Manual Setup Required for Backend

To complete the backend setup, manually run one of these commands in a new terminal:

**Option 1: Using the provided script (Windows)**
```cmd
.\run-maven-setup.cmd
```

**Option 2: Manual commands (Windows PowerShell)**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean package -DskipTests
```

**Option 3: Manual commands (Windows Command Prompt)**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean package -DskipTests
```

**Option 4: Using the mvn17 wrapper**
```cmd
.\mvn17.cmd clean package -f backend\pom.xml -DskipTests
```

## Verification

Once the backend setup is complete, you can verify by running:
- Build: `mvn clean package` (in backend directory)
- Test: `mvn test` (in backend directory)
- Run: `mvn spring-boot:run` (in backend directory)

For frontend:
- Build: `npm run build` (in frontend directory)
- Test: `npm test` (in frontend directory)
- Run: `npm start` (in frontend directory)
