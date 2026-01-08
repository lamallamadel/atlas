# Initial Repository Setup Instructions

## Setup Status

✅ **Frontend**: Dependencies installed successfully (1,188 packages)
⚠️ **Backend**: Requires manual setup due to Java 17 environment configuration

## What Has Been Done

### Frontend (Complete)
- ✅ Navigated to `frontend/` directory
- ✅ Ran `npm install` successfully
- ✅ All 1,188 packages installed
- ✅ Ready for development

### Backend (Manual Setup Required)
- Created setup scripts in `backend/` directory
- Requires Java 17 environment configuration before Maven can run

## Manual Backend Setup (Required)

The backend requires Java 17, but Maven needs the `JAVA_HOME` environment variable to be set. Due to security constraints, this must be done manually.

### Option 1: Using the Provided Batch Script (Windows - Easiest)

```cmd
cd backend
.\setup-repo.cmd
```

This script will:
1. Set `JAVA_HOME` to `C:\Environement\Java\jdk-17.0.5.8-hotspot`
2. Run `mvn clean install -gs settings.xml`
3. Install all backend dependencies

### Option 2: Using PowerShell Script

```powershell
cd backend
.\Run-MavenInstall.ps1
```

### Option 3: Using Existing Helper Scripts

```cmd
cd backend
.\run-mvn-java17.cmd clean install
```

### Option 4: Manual Environment Setup

**Windows PowerShell:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -gs settings.xml
```

**Windows Command Prompt:**
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
cd backend
mvn clean install -gs settings.xml
```

## Verification

After running the backend setup, verify the installation:

### Backend Verification
```bash
cd backend
mvn -version  # Should show Java 17
mvn test      # Run tests
```

### Frontend Verification
```bash
cd frontend
npm run lint  # Run linter
npm test      # Run tests
```

## Next Steps

Once both frontend and backend are set up:

1. **Start Infrastructure** (if using PostgreSQL):
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Run Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Run Frontend**:
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080
   - API Docs: http://localhost:8080/swagger-ui.html
   - Health Check: http://localhost:8080/actuator/health

## Development Commands Reference

### Backend
- **Build**: `mvn clean package`
- **Test**: `mvn test`
- **Run**: `mvn spring-boot:run`
- **E2E Tests (H2)**: `mvn verify -Pbackend-e2e-h2`
- **E2E Tests (PostgreSQL)**: `mvn verify -Pbackend-e2e-postgres`

### Frontend
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`
- **Run**: `npm start`
- **E2E Tests**: `npm run e2e`

## Troubleshooting

### Issue: "JAVA_HOME is not defined correctly"

**Solution**: Ensure JAVA_HOME is set to the Java 17 installation:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Issue: Maven command not found

**Solution**: Maven is installed at `C:\Environement\maven-3.8.6\bin\mvn.cmd`. Ensure it's in your PATH or use the full path.

### Issue: Port conflicts

**Solution**: Check if ports 8080 (backend) or 4200 (frontend) are already in use:
```powershell
Get-NetTCPConnection -LocalPort 8080
Get-NetTCPConnection -LocalPort 4200
```

## Files Created

- `backend/setup-repo.cmd` - Batch script for backend setup
- `backend/Run-MavenInstall.ps1` - PowerShell script for backend setup
- This file (`INITIAL_SETUP_INSTRUCTIONS.md`) - Setup instructions

## Summary

- ✅ Frontend is fully set up and ready to use
- ⚠️ Backend requires one manual command to complete setup
- All necessary scripts have been created for easy setup
- See AGENTS.md for additional development commands and architecture details
