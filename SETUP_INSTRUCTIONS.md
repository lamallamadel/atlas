# Initial Repository Setup Instructions

## Setup Status

### ✅ Completed
1. **Frontend dependencies installed** - `npm install` completed successfully in `frontend/` directory
   - 1187 packages installed
   - Angular 16.2.0 and all dependencies are ready
   
### ⚠️ Manual Steps Required

#### 1. Playwright Browsers Installation (Frontend E2E Tests)
The Playwright browser installation is blocked by security restrictions. Please run:

```bash
cd frontend
npx playwright install
```

This will install Chromium, Firefox, and WebKit browsers needed for E2E testing.

#### 2. Maven Proxy Configuration (Backend Build)
The Maven build is failing due to proxy configuration. The system is trying to use `localhost:8888` as a proxy, which is not accessible.

**Option A: Update Global Maven Settings (Recommended)**

Locate your Maven global settings file (usually `C:\Environement\maven-3.8.6\conf\settings.xml` or `%USERPROFILE%\.m2\settings.xml`) and ensure the proxy configuration is either removed or properly configured for your network.

**Option B: Use Project Settings File**

Run Maven with the project's settings.xml that disables proxies:

```bash
cd backend
mvn.cmd clean install -s settings.xml
```

**Option C: Set Environment Variable**

Before running Maven, unset the proxy environment variables:

```bash
cd backend
cmd /c "set http_proxy= && set https_proxy= && mvn.cmd clean install"
```

#### 3. Backend Build Command

Once proxy issues are resolved, run:

```bash
cd backend
mvn.cmd clean install
```

Or use the wrapper script:

```bash
.\backend\run-maven.ps1 clean install
```

This will:
- Download all Maven dependencies
- Compile the Spring Boot application
- Run tests (or use `-DskipTests` to skip)
- Create the JAR file in `backend/target/`

## Verification Commands

After completing the manual steps, verify the setup:

### Frontend
```bash
cd frontend
npm run build          # Should compile successfully
npm test               # Should run Karma tests
npm run e2e:fast       # Should run Playwright E2E tests
```

### Backend
```bash
cd backend
mvn.cmd test                        # Run unit tests
mvn.cmd verify -Pbackend-e2e-h2    # Run E2E tests with H2
mvn.cmd spring-boot:run            # Start the development server
```

## Environment Configuration

The project is configured to use:
- **Java 17** (JDK 17.0.5.8) via toolchains.xml
- **Maven 3.8.6**
- **Node.js v18.12.1**

The `backend/mvn.cmd` wrapper automatically sets JAVA_HOME to the correct Java 17 installation.

## Troubleshooting

### Maven Proxy Errors
If you see "Connection refused: localhost:8888", this indicates a proxy configuration issue. Follow Option A, B, or C above.

### Java Version Errors
If you see Java version mismatches, ensure you're using the `mvn.cmd` wrapper in the backend directory, not the global Maven command directly.

### Playwright Installation Fails
Run with admin privileges or use:
```bash
npx playwright install --with-deps
```

## Next Steps

Once the build succeeds:
1. Review AGENTS.md for detailed development commands
2. Check SETUP.md for infrastructure setup (Docker, PostgreSQL)
3. Start the backend: `cd backend && mvn.cmd spring-boot:run`
4. Start the frontend: `cd frontend && npm start`
