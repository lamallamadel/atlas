# Development Tools Documentation

This document describes the development tools and scripts available in this project.

## Overview

The project provides three ways to manage the development stack:

1. **`dev` script (Linux/Mac)** - Bash script for Unix-based systems
2. **`dev.ps1` script (Windows)** - PowerShell script for Windows
3. **`Makefile`** - Traditional Make-based commands for any platform with Make installed

All three tools provide the same functionality with consistent commands.

## Commands

### Start the Stack

Starts the complete development environment including infrastructure (PostgreSQL), backend (Spring Boot), and frontend (Angular).

```bash
# Linux/Mac
./dev up

# Windows
.\dev.ps1 up

# Make
make up
```

**What happens:**
1. PostgreSQL database starts in Docker
2. Backend builds (Maven) and starts on port 8080
3. Frontend dependencies install (npm) and dev server starts on port 4200

### Stop the Stack

Stops all running services.

```bash
# Linux/Mac
./dev down

# Windows
.\dev.ps1 down

# Make
make down
```

### Restart the Stack

Stops and starts all services.

```bash
# Linux/Mac
./dev restart

# Windows
.\dev.ps1 restart

# Make
make restart
```

### Check Status

Displays the status of all services.

```bash
# Linux/Mac
./dev status

# Windows
.\dev.ps1 status

# Make
make status
```

### View Logs

View logs from services. You can specify which service or view all.

```bash
# Linux/Mac
./dev logs              # All infrastructure logs
./dev logs backend      # Backend logs
./dev logs frontend     # Frontend logs
./dev logs db          # Database logs

# Windows
.\dev.ps1 logs
.\dev.ps1 logs backend
.\dev.ps1 logs frontend
.\dev.ps1 logs db

# Make
make logs               # All logs
make logs-backend
make logs-frontend
make logs-db
```

### Reset Database

Deletes all database data and recreates the database.

```bash
# Linux/Mac
./dev reset

# Windows
.\dev.ps1 reset

# Make
make reset
```

**Warning:** This permanently deletes all data in the database.

### Additional Make Commands

The Makefile provides additional commands:

```bash
make install      # Install all dependencies
make build        # Build backend and frontend
make test         # Run all tests
make clean        # Stop services and clean build artifacts
make help         # Show all available commands
```

## Prerequisites

All tools require the following to be installed:

- **Java 17** - JDK 17.0.5.8 or later
- **Maven 3.6+** - Java build tool
- **Node.js 18+** - JavaScript runtime
- **npm** - Node package manager
- **Docker** - Container runtime
- **Docker Compose** - Multi-container orchestration

### Setting JAVA_HOME

**IMPORTANT:** You must set `JAVA_HOME` to Java 17 before running any commands.

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
```

To make this permanent:
- **Windows:** Add to system environment variables
- **Linux/Mac:** Add to `~/.bashrc` or `~/.zshrc`

## Access URLs

Once the stack is running:

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **API Documentation (Swagger):** http://localhost:8080/swagger-ui.html
- **Health Check:** http://localhost:8080/actuator/health

## How the Scripts Work

### Process Management

**Linux/Mac (`dev` bash script):**
- Stores process IDs in `.backend.pid` and `.frontend.pid` files
- Uses `nohup` to run processes in the background
- Logs output to `backend/backend.log` and `frontend/frontend.log`

**Windows (`dev.ps1` PowerShell script):**
- Uses PowerShell jobs to manage background processes
- Stores job IDs in `.backend.pid` and `.frontend.pid` files
- Logs output to `backend/backend.log` and `frontend/frontend.log`

**Makefile:**
- Uses standard Unix process management
- Runs Maven and npm commands directly

### Infrastructure

All tools use `docker-compose` to manage the PostgreSQL database:
- Configuration: `infra/docker-compose.yml`
- Environment variables: `infra/.env` (created from `infra/.env.example`)

## Troubleshooting

### Services Won't Start

1. **Check JAVA_HOME:**
   ```bash
   echo $JAVA_HOME        # Linux/Mac
   echo $env:JAVA_HOME    # Windows
   ```

2. **Check if ports are in use:**
   - Port 8080: Backend
   - Port 4200: Frontend
   - Port 5432: PostgreSQL

3. **Check Docker is running:**
   ```bash
   docker ps
   ```

### Services Won't Stop

**Linux/Mac:**
```bash
pkill -f "spring-boot:run"
pkill -f "ng serve"
```

**Windows:**
```powershell
Get-Process | Where-Object { $_.CommandLine -like "*spring-boot:run*" } | Stop-Process -Force
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
```

### Clean Everything

To completely reset the development environment:

```bash
# Stop all services
./dev down  # or .\dev.ps1 down

# Clean build artifacts
cd backend && mvn clean
cd ../frontend && rm -rf node_modules dist .angular

# Remove database
cd ../infra && docker-compose down -v
```

Or simply:
```bash
make clean
```

## File Locations

### Log Files
- Backend: `backend/backend.log`
- Frontend: `frontend/frontend.log`

### PID Files
- Backend: `.backend.pid`
- Frontend: `.frontend.pid`

### Configuration
- Database: `infra/.env`
- Backend: `backend/src/main/resources/application.yml`
- Frontend: `frontend/proxy.conf.json`

## Best Practices

1. **Always set JAVA_HOME** before starting development
2. **Use `./dev status`** to check if services are running
3. **Use `./dev logs`** to debug issues
4. **Run `./dev down`** before shutting down your computer
5. **Use `./dev reset`** if the database gets into a bad state

## Integration with IDEs

You can still use your IDE's built-in runners:
- The scripts are designed to be IDE-friendly
- You can run backend/frontend separately in your IDE
- Just ensure infrastructure is running: `cd infra && docker-compose up -d`

## Contributing

When modifying the dev scripts:
1. Test on both Linux/Mac and Windows
2. Ensure error handling is consistent
3. Update this documentation
4. Keep all three tools (dev, dev.ps1, Makefile) in sync
