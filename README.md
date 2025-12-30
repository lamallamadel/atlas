# Project Name

A full-stack application with Spring Boot backend, Angular frontend, and PostgreSQL database.

## 🚀 Quick Start (< 10 minutes)

### Prerequisites

- **Java 17** (JDK 17.0.5.8 or later)
- **Maven 3.6+**
- **Node.js 18+** and **npm**
- **Docker & Docker Compose**

### Setup in 3 Steps

#### 1. Clone and Configure Java

**Windows (PowerShell):**
```powershell
git clone <repository-url>
cd <repository-name>
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

**Linux/Mac:**
```bash
git clone <repository-url>
cd <repository-name>
export JAVA_HOME=/path/to/jdk-17
```

#### 2. Start the Full Stack

**Option A: Using the dev script (Recommended)**

**Windows (PowerShell):**
```powershell
.\dev.ps1 up
```

**Linux/Mac:**
```bash
./dev up
```

**Option B: Using Make**
```bash
make up
```

This will:
- Start PostgreSQL database
- Build and start the backend (port 8080)
- Install dependencies and start the frontend (port 4200)

#### 3. Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **API Documentation:** http://localhost:8080/swagger-ui.html
- **Health Check:** http://localhost:8080/actuator/health

## 📋 Available Commands

### Using dev script

**Windows (PowerShell):**
```powershell
.\dev.ps1 up          # Start the full stack
.\dev.ps1 down        # Stop all services
.\dev.ps1 logs        # View logs (all services)
.\dev.ps1 logs backend    # View backend logs
.\dev.ps1 logs frontend   # View frontend logs
.\dev.ps1 logs db         # View database logs
.\dev.ps1 reset       # Reset database (delete all data)
.\dev.ps1 restart     # Restart all services
.\dev.ps1 status      # Check status of all services
```

**Linux/Mac:**
```bash
./dev up          # Start the full stack
./dev down        # Stop all services
./dev logs        # View logs (all services)
./dev logs backend    # View backend logs
./dev logs frontend   # View frontend logs
./dev logs db         # View database logs
./dev reset       # Reset database (delete all data)
./dev restart     # Restart all services
./dev status      # Check status of all services
```

### Using Makefile

```bash
make up           # Start the full stack
make down         # Stop all services
make logs         # View logs (all services)
make logs-backend # View backend logs
make logs-frontend # View frontend logs
make logs-db      # View database logs
make reset        # Reset database
make restart      # Restart all services
make status       # Check status
make clean        # Stop services and clean build artifacts
make help         # Show all available commands
```

### Manual Commands

#### Backend
```bash
cd backend
mvn clean install    # Build
mvn test            # Run tests
mvn spring-boot:run # Start server (port 8080)
```

#### Frontend
```bash
cd frontend
npm install         # Install dependencies
npm start          # Start dev server (port 4200)
npm test           # Run tests
npm run build      # Build for production
```

#### Infrastructure
```bash
cd infra
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
```

## 📁 Project Structure

```
/
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   └── pom.xml
├── frontend/            # Angular application
│   ├── src/
│   └── package.json
├── infra/              # Infrastructure configuration
│   ├── docker-compose.yml
│   ├── .env.example
│   └── reset-db scripts
├── .github/            # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/               # Documentation
│   └── CONTRIBUTING.md
├── dev                 # Development script (Linux/Mac)
├── dev.ps1            # Development script (Windows)
├── Makefile           # Make commands
└── README.md          # This file
```

## 🛠️ Tech Stack

### Backend
- Spring Boot 3.2.1
- Java 17
- Maven
- Spring Web, Validation, Actuator
- SpringDoc OpenAPI (Swagger)

### Frontend
- Angular 16
- TypeScript
- RxJS

### Infrastructure
- PostgreSQL 16
- Docker & Docker Compose

## 📚 Documentation

- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Contributing guidelines
- **[AGENTS.md](./AGENTS.md)** - Agent development guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[Backend README](./backend/README.md)** - Backend documentation
- **[Frontend README](./frontend/README.md)** - Frontend documentation

## 🔧 Configuration

### Database Configuration

Default credentials (configured in `infra/.env`):
- Host: localhost
- Port: 5432
- Database: myapp
- User: postgres
- Password: postgres

### Application Profiles

The backend supports multiple Spring profiles:
- `local` (default) - Uses H2 in-memory database
- `test` - Uses PostgreSQL for testing
- `prod` - Production configuration

Set profile via environment variable:
```bash
SPRING_PROFILES_ACTIVE=test mvn spring-boot:run
```

## 🐛 Troubleshooting

### Common Issues

**Java version mismatch:**
```bash
# Verify Java version
java -version
# Should show Java 17

# Set JAVA_HOME (adjust path as needed)
export JAVA_HOME=/path/to/jdk-17  # Linux/Mac
$env:JAVA_HOME = 'C:\Path\To\jdk-17'  # Windows PowerShell
```

**Port already in use:**
- Backend (8080): Check if another service is using the port
- Frontend (4200): Stop other Angular dev servers
- Database (5432): Stop other PostgreSQL instances

**Docker issues:**
```bash
# Check Docker is running
docker ps

# Reset Docker state
cd infra
docker-compose down -v
docker-compose up -d
```

## 🤝 Contributing

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

[Add your license information here]

## 👥 Team

[Add team information here]
