# Initial Setup Complete Guide

## Setup Status

### ✓ Frontend (Angular) - COMPLETE
All Node.js/Angular dependencies have been successfully installed and are ready to use.

### ⏳ Backend (Spring Boot) - REQUIRES ONE MANUAL STEP
The backend requires a single command to install Maven dependencies. This could not be completed automatically due to environment variable security restrictions.

---

## Quick Start - Complete Backend Setup

Choose **ONE** of these options to complete the backend setup:

### Option 1: Automated Script (Easiest)
```powershell
cd backend
node install.js
```

### Option 2: Maven Wrapper
```powershell
cd backend
.\mvn-java17.cmd clean install -DskipTests
```

### Option 3: Comprehensive Setup (Both Backend & Frontend)
```powershell
.\setup-all.ps1
```

### Option 4: Manual Maven
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd backend
mvn clean install -DskipTests
```

---

## Verify Setup

After running one of the backend setup options above, verify everything works:

### Test Backend
```powershell
cd backend
.\mvn-java17.cmd test
```

### Test Frontend
```powershell
cd frontend
npm test
```

---

## Development Commands

### Backend (Spring Boot)
```powershell
cd backend

# Build
.\mvn-java17.cmd clean package

# Run tests
.\mvn-java17.cmd test

# Start dev server (http://localhost:8080)
.\mvn-java17.cmd spring-boot:run
```

### Frontend (Angular)
```powershell
cd frontend

# Install dependencies (already done)
npm install

# Start dev server (http://localhost:4200)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Infrastructure (Optional)
```powershell
cd infra

# Start PostgreSQL and other services
docker-compose up -d

# Stop services
docker-compose down

# Reset database
.\reset-db.ps1  # Windows
./reset-db.sh   # Linux/Mac
```

---

## Project Structure

```
/
├── backend/              # Spring Boot application (Java 17)
│   ├── src/             # Source code
│   ├── pom.xml          # Maven configuration
│   ├── mvn-java17.cmd   # Maven wrapper with Java 17
│   └── install.js       # Automated setup script
│
├── frontend/            # Angular application (Node.js)
│   ├── src/            # Source code
│   ├── package.json    # npm configuration
│   └── node_modules/   # ✓ INSTALLED (665 packages)
│
├── infra/              # Docker infrastructure
│   └── docker-compose.yml
│
├── setup-all.ps1       # Complete setup script
├── setup-all.cmd       # Complete setup script (batch)
└── SETUP_STATUS.md     # Detailed setup status
```

---

## Common Issues

### "JAVA_HOME not defined correctly"
**Solution**: Use the provided Maven wrapper:
```powershell
cd backend
.\mvn-java17.cmd [your-maven-command]
```

### "npm ERR! ENOENT"
**Solution**: Make sure you're in the frontend directory:
```powershell
cd frontend
npm install
```

### "Maven compilation errors"
**Solution**: Ensure Java 17 is being used:
```powershell
cd backend
.\mvn-java17.cmd clean install -DskipTests
```

---

## URLs

After starting the dev servers:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Actuator**: http://localhost:8080/actuator

---

## Tech Stack

### Backend
- Spring Boot 3.2.1
- Java 17
- Maven 3.6+
- PostgreSQL (via Docker)
- Flyway (database migrations)
- SpringDoc OpenAPI (API documentation)

### Frontend
- Angular 16
- TypeScript 5.1
- RxJS 7.8
- Karma + Jasmine (testing)
- ESLint (linting)

---

## Important Notes

1. **Always use `mvn-java17.cmd` for backend Maven commands** instead of direct `mvn` to ensure Java 17 is used

2. **The session environment persists**, so if you set JAVA_HOME once in PowerShell, it remains set for that session

3. **The .gitignore is properly configured** - node_modules, target, and all build artifacts are ignored

4. **Frontend is 100% ready** - All npm dependencies are installed and you can run all npm commands immediately

5. **Backend needs one command** - Just run any of the backend setup options above to complete the setup

---

## Next Steps

1. Complete backend setup (run one command from the "Quick Start" section above)
2. Verify both backend and frontend work (see "Verify Setup" section)
3. Start development servers (see "Development Commands" section)
4. Start coding! 🚀

For more detailed information, see:
- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `SETUP_STATUS.md` - Current setup status
- `AGENTS.md` - Agent development guide
- `README.md` - Project documentation
