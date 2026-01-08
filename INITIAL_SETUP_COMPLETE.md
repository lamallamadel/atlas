# Initial Setup Complete

## What Has Been Done

✅ **Frontend Dependencies Installed**
- Ran `npm install` in frontend directory
- All 1,188 packages installed successfully
- Ready for: `npm run build`, `npm test`, `npm run lint`

## What You Need to Do

### 1. Install Backend Dependencies (Required)

The backend requires Java 17 and Maven. Run this command:

**Windows PowerShell (Recommended):**
```powershell
cd backend
.\install-java17.ps1
```

**Alternative - Windows CMD:**
```cmd
cd backend
call install.cmd
```

This will:
- Use Java 17 from `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- Run `mvn clean install` to download all Maven dependencies
- Compile the Spring Boot application

### 2. Install Playwright Browsers (Optional - for E2E tests only)

If you plan to run end-to-end tests:

```powershell
cd frontend
npx playwright install
```

## Verify Setup

### Backend
```powershell
cd backend
mvn test
```

### Frontend  
```powershell
cd frontend
npm test
```

## Why Manual Backend Setup?

The automated setup tool cannot modify environment variables (JAVA_HOME) due to security restrictions. The provided scripts (`install-java17.ps1`, `install.cmd`) handle this for you.

## Next Steps

After completing backend setup, you can:
- **Build**: `cd backend && mvn clean package`
- **Test**: `cd backend && mvn test`  
- **Run**: `cd backend && mvn spring-boot:run`
- **E2E Tests**: See `AGENTS.md` for E2E testing options

See `AGENTS.md` for complete development commands and workflow.
