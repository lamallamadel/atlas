# Initial Setup Complete (Partial)

## ✅ Completed Setup

### Frontend Setup - COMPLETE
- ✅ Node.js dependencies installed (`npm ci` completed successfully)
- ✅ 1177 packages installed in `frontend/node_modules/`
- ✅ Ready for development, build, and testing

### Backend Setup - REQUIRES MANUAL STEP

Due to security restrictions on environment variable modifications, the backend Maven build needs to be run manually.

## 🔧 Required Manual Step: Backend Setup

The backend requires Java 17 and Maven. A wrapper script has been provided in the repo.

**Run ONE of the following commands from the repository root:**

### Option 1: Using the backend/mvn.cmd wrapper (Windows)
```cmd
cd backend
mvn.cmd clean install -DskipTests
```

### Option 2: Using the root mvn17.cmd wrapper (Windows)
```cmd
mvn17.cmd -f backend\pom.xml clean install -DskipTests
```

### Option 3: Using PowerShell with Java 17
```powershell
cd backend
.\run-maven-build.ps1
```

### Option 4: Manual environment setup (any platform)
```bash
# Windows (PowerShell)
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests

# Linux/Mac
export JAVA_HOME=/path/to/jdk-17
cd backend
mvn clean install -DskipTests
```

## 📋 Verification

After running the backend setup, verify with:

```bash
# Check backend build artifacts
ls backend/target/backend.jar

# Verify frontend setup
ls frontend/node_modules/@angular/core

# Run backend tests (optional)
cd backend
mvn test

# Run frontend tests (optional)
cd frontend
npm test
```

## 🚀 Next Steps

Once the backend Maven build completes:

1. **Start Development Server (Backend)**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Development Server (Frontend)**
   ```bash
   cd frontend
   npm start
   ```

3. **Run Tests**
   - Backend: `cd backend && mvn test`
   - Frontend: `cd frontend && npm test`
   - Backend E2E (H2): `cd backend && mvn verify -Pbackend-e2e-h2`
   - Backend E2E (PostgreSQL): `cd backend && mvn verify -Pbackend-e2e-postgres`
   - Frontend E2E: `cd frontend && npm run e2e`

4. **Install Playwright Browsers** (for E2E tests)
   ```bash
   cd frontend
   npx playwright install
   ```

## 📚 Additional Information

- See `AGENTS.md` for detailed commands and architecture
- Backend uses Spring Boot 3.2.1 with Java 17
- Frontend uses Angular 16
- Docker is required for PostgreSQL-based tests
- Testcontainers used for backend PostgreSQL E2E tests

## 🔍 Troubleshooting

If the backend build fails:
1. Verify Java 17 is installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot`
2. Verify Maven is installed at `C:\Environement\maven-3.8.6`
3. Check that the `toolchains.xml` file is correctly configured
4. Ensure port 8080 is not in use
5. Check the backend/target directory for error logs
