# Project Documentation Index

This document provides an overview of all documentation available in this project.

## Quick Links

### Getting Started
- **[README.md](../README.md)** - Main project documentation with quick start guide (< 10 minutes)
- **[SETUP.md](../SETUP.md)** - Detailed setup instructions and troubleshooting
- **[AGENTS.md](../AGENTS.md)** - Agent development guide with build/test/lint commands

### Development
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines, code standards, and workflow
- **[DEV_TOOLS.md](./DEV_TOOLS.md)** - Complete guide to dev scripts and Makefile

### Component-Specific
- **[backend/README.md](../backend/README.md)** - Backend (Spring Boot) documentation
- **[frontend/README.md](../frontend/README.md)** - Frontend (Angular) documentation
- **[infra/README.md](../infra/README.md)** - Infrastructure and Docker setup

## Documentation Structure

### Root Level

#### README.md
The main entry point for the project. Contains:
- Quick start guide (< 10 minutes to get running)
- Prerequisites and setup
- Available commands for all platforms
- Project structure overview
- Tech stack information
- Troubleshooting guide

#### SETUP.md
Detailed setup instructions including:
- Java environment configuration
- Maven toolchains setup
- Step-by-step installation
- Build commands

#### AGENTS.md
Guide for AI agents and developers covering:
- Build, lint, and test commands
- Tech stack details
- Architecture overview

### docs/ Directory

#### CONTRIBUTING.md
Comprehensive contributing guide with:
- Code of conduct
- Development workflow
- Git workflow and branch naming
- Commit message conventions
- Code standards for Java and TypeScript
- Testing guidelines
- Pull request process
- Issue guidelines

#### DEV_TOOLS.md
Complete reference for development tools:
- Usage of `dev` script (Linux/Mac)
- Usage of `dev.ps1` script (Windows)
- Usage of Makefile
- Command reference
- Troubleshooting

#### PROJECT_DOCUMENTATION_INDEX.md
This file - index of all documentation.

### .github/ Directory

#### Pull Request Template
**Location:** `.github/PULL_REQUEST_TEMPLATE.md`

Template for submitting pull requests with:
- Description fields
- Type of change checklist
- Testing checklist
- Review guidelines

#### Issue Templates
**Location:** `.github/ISSUE_TEMPLATE/`

Three issue templates:
1. **bug_report.md** - For reporting bugs
2. **feature_request.md** - For requesting new features
3. **question.md** - For asking questions

Plus **config.yml** for GitHub issue template configuration.

## Development Tools

### Command-Line Tools

The project provides three equivalent ways to manage the development stack:

1. **`./dev` (Linux/Mac)**
   ```bash
   ./dev up      # Start everything
   ./dev down    # Stop everything
   ./dev status  # Check status
   ./dev logs    # View logs
   ./dev reset   # Reset database
   ```

2. **`.\dev.ps1` (Windows)**
   ```powershell
   .\dev.ps1 up
   .\dev.ps1 down
   .\dev.ps1 status
   .\dev.ps1 logs
   .\dev.ps1 reset
   ```

3. **`make` (All platforms with Make installed)**
   ```bash
   make up
   make down
   make status
   make logs
   make reset
   make build
   make test
   make clean
   ```

See [DEV_TOOLS.md](./DEV_TOOLS.md) for complete documentation.

## Technology Stack

### Backend
- **Framework:** Spring Boot 3.2.1
- **Language:** Java 17
- **Build Tool:** Maven 3.6+
- **API Documentation:** SpringDoc OpenAPI (Swagger)
- **Documentation:** [backend/README.md](../backend/README.md)

### Frontend
- **Framework:** Angular 16
- **Language:** TypeScript
- **Build Tool:** Angular CLI
- **Documentation:** [frontend/README.md](../frontend/README.md)

### Infrastructure
- **Database:** PostgreSQL 16
- **Container Runtime:** Docker & Docker Compose
- **Documentation:** [infra/README.md](../infra/README.md)

## Quick Reference

### Starting Development (First Time)

1. **Set JAVA_HOME:**
   ```bash
   export JAVA_HOME=/path/to/jdk-17        # Linux/Mac
   $env:JAVA_HOME = 'C:\Path\To\jdk-17'   # Windows
   ```

2. **Start the stack:**
   ```bash
   ./dev up           # Linux/Mac
   .\dev.ps1 up       # Windows
   make up            # Make
   ```

3. **Access the application:**
   - Frontend: http://localhost:4200
   - Backend: http://localhost:8080
   - API Docs: http://localhost:8080/swagger-ui.html

### Common Tasks

| Task | See Documentation |
|------|-------------------|
| First-time setup | [README.md](../README.md) |
| Contributing code | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Running tests | [AGENTS.md](../AGENTS.md) |
| Using dev scripts | [DEV_TOOLS.md](./DEV_TOOLS.md) |
| Troubleshooting | [README.md](../README.md#troubleshooting) |
| Backend development | [backend/README.md](../backend/README.md) |
| Frontend development | [frontend/README.md](../frontend/README.md) |
| Database management | [infra/README.md](../infra/README.md) |

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 4200 | http://localhost:4200 |
| Backend | 8080 | http://localhost:8080 |
| Swagger UI | 8080 | http://localhost:8080/swagger-ui.html |
| Health Check | 8080 | http://localhost:8080/actuator/health |
| PostgreSQL | 5432 | localhost:5432 |

## Contributing

Before contributing, please read:
1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
2. [CODE_OF_CONDUCT](./CONTRIBUTING.md#code-of-conduct) - Code of conduct

### Pull Request Checklist
- [ ] Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- [ ] Create feature branch
- [ ] Write tests
- [ ] Update documentation
- [ ] Fill out PR template
- [ ] All CI checks pass

### Creating Issues
Use the appropriate issue template:
- **Bug Report:** For bugs and errors
- **Feature Request:** For new features
- **Question:** For questions and support

## Additional Resources

### External Documentation
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Angular Documentation](https://angular.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Maven Documentation](https://maven.apache.org/guides/)

### Project Links
- Repository: [Update with your repo URL]
- Issues: [Update with your issues URL]
- Discussions: [Update with your discussions URL]
- Wiki: [Update with your wiki URL]

## Updating Documentation

When making significant changes:
1. Update the relevant documentation files
2. Add entries to this index if creating new docs
3. Update the README.md if affecting quick start
4. Keep all three dev tools (dev, dev.ps1, Makefile) in sync
5. Include documentation updates in your PR

---

**Last Updated:** [Add date when updating]
