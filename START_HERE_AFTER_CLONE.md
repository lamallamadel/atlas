# 🚀 Start Here - Newly Cloned Repository

Welcome! You've just cloned this repository. Here's what you need to know to get started.

## Quick Start (3 Steps)

### Step 1: Complete Setup
Run the setup script to build the backend:

```cmd
setup-repo.cmd
```

This will:
- ✅ Build the backend (Maven clean install)
- ✅ Install Playwright browsers for E2E tests

**Note:** Frontend dependencies are already installed (`npm install` was completed during initial setup).

### Step 2: Start the Application

**Terminal 1 - Backend:**
```cmd
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm start
```

### Step 3: Open Your Browser
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **API Docs:** http://localhost:8080/swagger-ui.html

## That's It! 🎉

You're now ready to develop. See the commands below for common tasks.

---

## Common Development Commands

### Backend
```cmd
cd backend

# Run tests
mvn test

# Run E2E tests (H2 in-memory database)
mvn verify -Pbackend-e2e-h2

# Run E2E tests (PostgreSQL with Testcontainers)
mvn verify -Pbackend-e2e-postgres

# Build package
mvn clean package

# Start dev server
mvn spring-boot:run
```

### Frontend
```cmd
cd frontend

# Run unit tests
npm test

# Run E2E tests (fast - single browser, H2 backend)
npm run e2e:fast

# Run E2E tests (all configurations)
npm run e2e:full

# Run E2E tests with UI (interactive debugging)
npm run e2e:ui

# Build for production
npm run build

# Start dev server
npm start
```

### Infrastructure (Optional - Requires Docker)
```cmd
cd infra

# Start PostgreSQL and other services
docker-compose up -d

# Stop services
docker-compose down

# Reset database
.\reset-db.ps1    # Windows PowerShell
./reset-db.sh     # Linux/Mac
```

---

## Project Structure

```
/
├── backend/          Spring Boot 3.2.1 (Java 17)
│   ├── src/main/     Application code
│   ├── src/test/     Unit tests
│   └── pom.xml       Maven configuration
│
├── frontend/         Angular 16
│   ├── src/app/      Application code
│   ├── src/test/     Unit tests
│   ├── e2e/          Playwright E2E tests
│   └── package.json  npm configuration
│
├── infra/           Docker infrastructure
│   └── docker-compose.yml
│
└── docs/            Documentation
```

## Important Notes

### Java 17 Required
Maven commands require Java 17. The helper script `backend/mvn-java17.cmd` automatically sets this:

```cmd
cd backend
mvn-java17.cmd clean package
```

Or set manually:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Environment Prerequisites
- ✅ Java 17 - `C:\Environement\Java\jdk-17.0.5.8-hotspot`
- ✅ Maven 3.8.6 - `C:\Environement\maven-3.8.6`
- ✅ Node.js 18+ - Confirmed working
- 🐳 Docker - Optional (for infrastructure)

---

## Need Help?

See these comprehensive guides:

| Document | Purpose |
|----------|---------|
| **SETUP_INSTRUCTIONS_INITIAL_CLONE.md** | Detailed setup instructions |
| **INITIAL_SETUP_COMPLETE.md** | Setup completion status |
| **SETUP_STATUS.md** | Current repository status |
| **AGENTS.md** | Complete development guide |
| **README.md** | Project overview |

---

## Troubleshooting

### "JAVA_HOME is not defined correctly"
```cmd
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
```

### Port 8080 or 4200 already in use
Stop other applications or configure different ports.

### Tests fail
Ensure all services are running and ports are available.

---

**Ready? Run this command to complete setup:**

```cmd
setup-repo.cmd
```

Then start developing! 🚀
