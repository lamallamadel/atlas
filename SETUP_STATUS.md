# Initial Repository Setup Status

## Completed Steps

### ✓ Frontend Dependencies
- **Status**: COMPLETE
- **Command Used**: `npm install` (in frontend directory)
- **Result**: Successfully installed 1178 packages
- **Location**: `frontend/node_modules/`
- **Time**: ~2 minutes

## Pending Steps

### ⏳ Backend Dependencies
- **Status**: PENDING (Security restrictions prevented automated setup)
- **Required Command**: 
  ```cmd
  set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
  cd backend
  mvn clean install -DskipTests
  ```
- **Alternative (PowerShell)**:
  ```powershell
  $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
  cd backend
  mvn clean install -DskipTests
  ```
- **Helper Scripts Available**:
  - `mvn17.cmd` - Maven wrapper with Java 17
  - `mvn17.ps1` - PowerShell Maven wrapper with Java 17
  - `install-backend-deps.js` - Node.js helper script

### ⏳ Playwright Browsers
- **Status**: PENDING (npx commands blocked by security policy)
- **Required Command**:
  ```cmd
  cd frontend
  npx playwright install
  ```
- **Alternative**:
  ```cmd
  cd frontend
  npm run install-browsers
  ```

## Manual Setup Required

Due to security restrictions on script execution, the following steps need to be completed manually:

1. **Backend Maven Install**:
   ```cmd
   # Option 1: Direct command
   set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
   cd backend
   mvn clean install -DskipTests

   # Option 2: Use wrapper script
   .\mvn17.cmd -f backend\pom.xml clean install -DskipTests

   # Option 3: Use Node.js helper
   node install-backend-deps.js
   ```

2. **Playwright Browser Installation**:
   ```cmd
   cd frontend
   npx playwright install
   ```

## Environment Details

- **Java 17 Location**: `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- **Maven Version**: 3.8.6 (located at `C:\Environement\maven-3.8.6`)
- **Node Version**: v25.2.1
- **Current Java (default)**: Java 8 (needs to be overridden with JAVA_HOME)

## Toolchains Configuration

A `toolchains.xml` file exists in the repository root with Java 17 configuration. To use it:

1. Copy to Maven directory:
   ```cmd
   copy toolchains.xml %USERPROFILE%\.m2\toolchains.xml
   ```

2. Maven will automatically use Java 17 for compilation (though Maven itself still needs JAVA_HOME set to run).

## Helper Scripts Created

The following helper scripts have been created to assist with setup:

- **setup-now.ps1**: Complete setup script (PowerShell)
- **run-backend-install.cmd**: Backend Maven install script (Batch)
- **install-backend-deps.js**: Backend Maven install script (Node.js)

## Next Steps

After completing the manual setup steps above, you can proceed with:

1. **Build backend**: `cd backend && mvn clean package`
2. **Run backend**: `cd backend && mvn spring-boot:run`
3. **Test backend**: `cd backend && mvn test`
4. **Build frontend**: `cd frontend && npm run build`
5. **Run frontend**: `cd frontend && npm start`
6. **E2E tests**: `cd frontend && npm run e2e`

See `AGENTS.md` for complete command reference.

## Troubleshooting

If you encounter issues:

1. **JAVA_HOME not set**: Ensure JAVA_HOME points to Java 17 before running Maven
2. **Maven not found**: Ensure Maven 3.6+ is installed and in PATH
3. **Port conflicts**: Check that ports 8080 (backend), 4200 (frontend), 5432 (PostgreSQL) are available
4. **Docker not running**: Start Docker Desktop if running E2E tests with PostgreSQL

See `AGENTS.md` for detailed troubleshooting guidance.
