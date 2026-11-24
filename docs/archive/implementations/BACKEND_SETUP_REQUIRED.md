# Backend Setup Required

## Status
✅ Frontend dependencies installed successfully  
⚠️ Backend requires manual setup due to Java 17 requirement

## What Was Done
1. ✅ Enabled Maven toolchains plugin in `backend/pom.xml`
2. ✅ Verified Java 17 is available at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
3. ✅ Verified toolchains.xml is configured in `~/.m2/toolchains.xml`
4. ✅ Installed frontend dependencies (`npm install`)

## What Needs To Be Done

The backend requires Java 17 to build, but Maven needs `JAVA_HOME` set to bootstrap.

### Option 1: Use the provided mvn17.cmd wrapper
```cmd
.\mvn17.cmd -f backend\pom.xml clean install -DskipTests
```

### Option 2: Set JAVA_HOME manually (PowerShell)
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

### Option 3: Set JAVA_HOME manually (Command Prompt)
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -DskipTests
```

### Option 4: Use the setup script
Run the existing setup script that handles this:
```powershell
.\set-java-env.ps1
cd backend
mvn clean install -DskipTests
```

## Verification

After running one of the above commands, verify the setup:

### Build
```powershell
mvn -f backend\pom.xml clean package
```

### Test
```powershell
mvn -f backend\pom.xml test
```

### Frontend Build
```powershell
cd frontend
npm run build
```

### Frontend Test
```powershell
cd frontend
npm test
```

## Next Steps

Once the backend is installed, you can:
- Start infrastructure: `cd infra && docker-compose up -d`
- Run backend: `cd backend && mvn spring-boot:run`
- Run frontend: `cd frontend && npm start`
- Or use the dev management script: `.\dev.ps1 up`
