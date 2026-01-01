# Quick Start Guide

## Current Status

✅ **Frontend**: Ready to use immediately  
⚠️ **Backend**: Requires one manual command (see below)

## 🚀 Complete the Setup

### Step 1: Backend Setup (One-Time, ~3 minutes)

Open a terminal and run:

```cmd
cd backend
setup.cmd
```

Or in PowerShell:

```powershell
cd backend
.\run-maven.ps1
```

**That's it!** This will:
- Set Java 17 as the Java version
- Download all Maven dependencies
- Build the Spring Boot application

### Step 2: Start Development

After backend setup completes, you can start the full stack:

```powershell
# Start everything with one command
.\dev.ps1 up
```

Or start services individually:

```powershell
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - Database (optional)
cd infra
docker-compose up -d
```

## 📍 Access Points

Once running:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health

## 🛠️ Daily Development Commands

### Backend
```powershell
cd backend
mvn test                  # Run tests
mvn clean package         # Build
mvn spring-boot:run       # Start server
mvn-java17.cmd <args>     # Run any Maven command with Java 17
```

### Frontend
```powershell
cd frontend
npm start                 # Dev server
npm test                  # Run tests
npm run build             # Production build
npm run lint              # Lint code
```

### Full Stack
```powershell
.\dev.ps1 up              # Start all services
.\dev.ps1 down            # Stop all services
.\dev.ps1 status          # Check status
.\dev.ps1 logs            # View logs
```

## 📋 Build, Lint, Test Commands

As requested in AGENTS.md:

### Backend
- **Build**: `cd backend && mvn clean package`
- **Test**: `cd backend && mvn test`
- **Lint**: Not configured (can add Checkstyle if needed)
- **Dev Server**: `cd backend && mvn spring-boot:run`

### Frontend
- **Build**: `cd frontend && npm run build`
- **Test**: `cd frontend && npm test`
- **Lint**: `cd frontend && npm run lint`
- **Dev Server**: `cd frontend && npm start`

### Infrastructure
- **Start**: `cd infra && docker-compose up -d`
- **Stop**: `cd infra && docker-compose down`

## 💡 Tips

1. **Use the helper scripts**: `backend/mvn-java17.cmd` ensures Java 17 is always used
2. **Use dev.ps1**: Manages the entire development stack with one command
3. **Check AGENTS.md**: Complete reference for all development workflows
4. **Frontend works now**: You can start developing the frontend immediately while backend sets up

## ❓ Need Help?

- **Full Documentation**: See [AGENTS.md](./AGENTS.md)
- **Setup Details**: See [INITIAL_SETUP_STATUS.md](./INITIAL_SETUP_STATUS.md)
- **Setup Instructions**: See [SETUP.md](./SETUP.md)

---

**Ready to start?** Run `cd backend && setup.cmd` to complete the setup!
