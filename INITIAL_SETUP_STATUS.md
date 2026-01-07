# Initial Repository Setup - Status Report

## Setup Summary

This repository has been set up for initial development work. The frontend is fully configured, while the backend requires one manual command due to Java environment configuration requirements.

## ✅ Completed: Frontend Setup

**Status**: Fully Complete  
**Location**: `frontend/`  
**Package Manager**: npm  
**Node Version**: v18.12.1  

### Installed
- 1,188 npm packages installed
- Angular 16.2.0 and all dependencies
- Development tools (ESLint, Karma, Playwright)
- Chart.js and Angular Material

### Ready to Use Commands
```powershell
cd frontend

# Development server
npm start                    # Starts dev server on http://localhost:4200

# Build
npm run build               # Production build
npm run watch               # Development build with watch

# Testing
npm test                    # Run unit tests
npm run e2e                 # Run end-to-end tests
npm run e2e:fast           # Fast E2E tests

# Linting
npm run lint               # Run ESLint
```

## ⚠️ Requires Manual Step: Backend Setup

**Status**: Pending One Command  
**Location**: `backend/`  
**Build Tool**: Maven  
**Java Version Required**: Java 17  

### Why Manual Step is Needed
The system security policy prevents:
- Setting environment variables programmatically (`$env:JAVA_HOME = ...`)
- Executing batch/PowerShell scripts
- Creating processes with custom environments
- Writing to user directories outside the repository

### Quick Setup - Choose One Option:

#### Option A: Using the provided wrapper (Recommended)
```powershell
# From repository root
mvn17.cmd clean install -DskipTests -f backend\pom.xml
```

#### Option B: Set Java and run Maven
```powershell
# Set Java 17
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Install backend dependencies
cd backend
mvn clean install -DskipTests --toolchains toolchains.xml
```

#### Option C: One-time toolchains setup (if you have multiple Java versions)
```powershell
# Copy toolchains file (one-time)
Copy-Item backend\toolchains.xml $env:USERPROFILE\.m2\toolchains.xml

# Then set Java and run
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests
```

### After Backend Setup is Complete

Once you've run the Maven command, these commands will work:

```powershell
cd backend

# Build
mvn clean package          # Build JAR file

# Test
mvn test                   # Run all tests
mvn test -Dtest=ClassName  # Run specific test

# Run application
mvn spring-boot:run        # Start on http://localhost:8080

# Checkstyle (if configured)
mvn checkstyle:check       # Check code style
```

## 📁 Repository Structure

```
Atlasia/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Java source code
│   │   │   └── resources/     # Configuration files
│   │   └── test/              # Test files
│   ├── pom.xml                # Maven configuration
│   ├── toolchains.xml         # Java 17 toolchain config
│   └── settings.xml           # Maven settings
│
├── frontend/                   # Angular application
│   ├── src/
│   │   ├── app/               # Angular components
│   │   ├── assets/            # Static assets
│   │   └── environments/      # Environment configs
│   ├── e2e/                   # End-to-end tests
│   ├── package.json           # npm configuration
│   └── angular.json           # Angular CLI config
│
├── infra/                      # Infrastructure
│   ├── docker-compose.yml     # PostgreSQL, etc.
│   └── reset-db scripts       # Database reset utilities
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── mvn17.cmd                  # Maven wrapper with Java 17
└── dev.ps1                    # Development stack manager
```

## 🛠 Tech Stack

### Backend
- **Framework**: Spring Boot 3.2.1
- **Java**: OpenJDK 17.0.5.8
- **Build Tool**: Apache Maven 3.8.6
- **Dependencies**:
  - Spring Web, Security, Data JPA
  - OAuth2 Resource Server
  - PostgreSQL + H2 Database
  - Flyway (migrations)
  - Elasticsearch
  - Thymeleaf (templates)
  - SpringDoc OpenAPI
  - Testcontainers

### Frontend
- **Framework**: Angular 16.2.0
- **Language**: TypeScript 5.1.3
- **UI**: Angular Material 16.2.0
- **Charts**: Chart.js 4.4.0
- **Auth**: angular-oauth2-oidc 16.0.0
- **Testing**: Jasmine, Karma, Playwright
- **Linting**: ESLint with Angular plugin

### Infrastructure
- **Database**: PostgreSQL (via Docker)
- **Container**: Docker & Docker Compose
- **Search**: Elasticsearch

## 🚀 Quick Start Guide

### 1. Complete Backend Setup (Do This First)
```powershell
# Run ONE of the commands from "Quick Setup" section above
mvn17.cmd clean install -DskipTests -f backend\pom.xml
```

### 2. Start Infrastructure (Optional - for database)
```powershell
cd infra
docker-compose up -d
```

### 3. Start Development Servers

**Terminal 1 - Backend**:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend**:
```powershell
cd frontend
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health

## 📝 Important Files

### Configuration Files
- **backend/pom.xml** - Maven dependencies and build configuration
- **backend/toolchains.xml** - Java 17 toolchain for Maven
- **backend/settings.xml** - Maven repository settings
- **frontend/package.json** - npm dependencies
- **frontend/angular.json** - Angular CLI configuration
- **frontend/proxy.conf.json** - API proxy configuration

### Helper Scripts
- **mvn17.cmd** - Maven wrapper that sets Java 17
- **dev.ps1** - Full stack management (up/down/status)
- **Makefile** - Unix-style commands (requires WSL or Linux)

### Documentation
- **AGENTS.md** - Agent development guide (build/test commands)
- **SETUP.md** - Detailed setup instructions
- **README.md** - Project overview

## ✨ What's Already Configured

- ✅ Frontend dependencies installed (node_modules)
- ✅ Maven toolchains configured for Java 17
- ✅ Maven settings configured (proxy bypass, central repo)
- ✅ Git ignore patterns for build artifacts
- ✅ Development server configurations
- ✅ Test frameworks (Jasmine, JUnit, Testcontainers)
- ✅ API documentation (OpenAPI/Swagger)
- ✅ Database migrations (Flyway)
- ✅ Security configuration (OAuth2)

## 🎯 Next Steps

1. **Run the backend setup command** (see "Quick Setup" section)
2. **Verify the setup**:
   ```powershell
   # Backend
   cd backend
   mvn clean package  # Should complete successfully
   
   # Frontend
   cd frontend
   npm run build      # Should complete successfully
   ```
3. **Start developing**!

## 📊 Estimated Times

- Frontend setup: ✅ **Complete** (already done)
- Backend setup: ⏱ **3-5 minutes** (run one command)
- First build: ⏱ **2-3 minutes** (Maven downloads dependencies)
- Test run: ⏱ **1-2 minutes**

## 🔧 Troubleshooting

### "JAVA_HOME is not defined correctly"
**Solution**: Set JAVA_HOME before running Maven:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Maven can't find dependencies
**Solution**: Use the provided settings.xml:
```powershell
mvn clean install --settings backend\settings.xml
```

### Tests are failing
**Solution**: Skip tests during initial setup:
```powershell
mvn clean install -DskipTests
```

### Port 8080 or 4200 already in use
**Solution**: Stop the conflicting service or change the port in configuration files

## 📞 Support Resources

- **AGENTS.md** - Build, lint, and test commands
- **SETUP.md** - Detailed setup instructions with toolchains info
- **README.md** - Project overview and architecture
- **backend/README.md** - Backend-specific documentation
- **frontend/README.md** - Frontend-specific documentation

---

**Status**: 🟡 **90% Complete** - Just run one Maven command to finish!
