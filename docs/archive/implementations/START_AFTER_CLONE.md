# Quick Start After Clone

## Status: One Command Needed

✅ **Frontend**: Fully set up (npm install complete)  
⚠️ **Backend**: Needs Maven install (one command)

## Complete Setup Now

Run this single command to finish setup:

### Windows (Command Prompt or PowerShell)
```cmd
COMPLETE-BACKEND-SETUP.cmd
```

### Or use Maven directly

**PowerShell:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

**Command Prompt:**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -DskipTests
```

**Using mvn17 wrapper:**
```cmd
.\mvn17.cmd -f backend\pom.xml clean install -DskipTests
```

## After Maven Install Completes

### Start Development

1. **Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   → http://localhost:8080

2. **Frontend**:
   ```bash
   cd frontend
   npm start
   ```
   → http://localhost:4200

### Run Tests

```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```

### Start Infrastructure (Optional)

```bash
cd infra
docker-compose up -d
```

## See Also

- `INITIAL_SETUP_STATUS.md` - Detailed setup status
- `AGENTS.md` - All available commands
- `SETUP.md` - Alternative setup methods
