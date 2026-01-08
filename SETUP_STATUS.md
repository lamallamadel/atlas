# Repository Setup Status

## Completed Setup Steps

### ✅ Frontend Setup - COMPLETE
The frontend dependencies have been successfully installed:

```
cd frontend
npm install
```

**Status**: ✅ Complete
- Node modules installed (1188 packages)
- Frontend is ready for development
- Can run: `npm start`, `npm run build`, `npm test`, `npm run lint`

### ⚠️ Backend Setup - REQUIRES MANUAL COMPLETION

Due to security restrictions in the automated environment, the backend setup requires Java 17 with JAVA_HOME environment variable set, which must be done manually.

#### Required Steps:

**Option 1: Using PowerShell**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd backend
mvn clean install
```

**Option 2: Using the provided wrapper script**
```powershell
.\backend-install.ps1
```

**Option 3: Using Command Prompt**
```cmd
cd backend
.\mvn-java17.cmd clean install
```

**Option 4: Using existing CMD wrapper**
```cmd
.\mvn17.cmd clean install -f backend\pom.xml
```

#### Verification

After running the backend setup, verify it completed successfully:
```powershell
# Check that target directory was created
Test-Path backend\target

# Check that JAR file was built
Test-Path backend\target\backend.jar
```

### 📋 Infrastructure Setup (Optional)

The infrastructure (Docker containers for PostgreSQL, etc.) is optional for initial development but required for E2E tests with PostgreSQL:

```bash
cd infra
docker-compose up -d
```

## Quick Start After Setup

Once both frontend and backend are set up:

### Using Make (Recommended)
```bash
# Set JAVA_HOME first
export JAVA_HOME=/path/to/jdk-17  # Linux/Mac
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'  # PowerShell

# Then use make commands
make install    # Install all dependencies
make build      # Build everything
make test       # Run all tests
make up         # Start full stack
```

### Manual Start

**Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm start
```

## Access Points

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html
- Health Check: http://localhost:8080/actuator/health

## Testing

### Backend Tests
```bash
cd backend
mvn test                          # Unit tests
mvn verify -Pbackend-e2e-h2      # E2E tests with H2
mvn verify -Pbackend-e2e-postgres # E2E tests with PostgreSQL
```

### Frontend Tests
```bash
cd frontend
npm test                    # Unit tests
npm run e2e                # E2E tests (H2 + mock auth)
npm run e2e:fast           # Fast E2E tests
npm run e2e:full           # All E2E configurations
```

## Common Issues

### JAVA_HOME not set
**Error:** `The JAVA_HOME environment variable is not defined correctly`

**Solution:** Set JAVA_HOME before running Maven commands:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Port already in use
**Error:** Port 8080 or 4200 already in use

**Solution:** Stop other processes using these ports or change the port in configuration

### Maven build fails
**Error:** Various Maven errors

**Solution:** 
1. Ensure Java 17 is being used: `java -version`
2. Try with fresh Maven repository: `mvn clean install -U`
3. Check internet connection for dependency downloads

## Files Created During Setup

The following helper scripts have been created and are gitignored:
- `backend-install.ps1` - PowerShell script to install backend with Java 17
- `setup-backend-init.ps1` - Alternative setup script

These can be used for setup but are not required to be committed to the repository.

## Next Steps

1. Complete backend setup using one of the methods above
2. Verify both frontend and backend build successfully
3. Start development using `make up` or manual commands
4. Run tests to ensure everything works: `make test`
5. Review AGENTS.md for detailed development guidelines
6. Review SETUP.md for additional configuration options
