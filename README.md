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
- Build and start the backend with local profile (H2 database, port 8080)
- Install dependencies and start the frontend (port 4200)

#### 3. Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **API Documentation:** http://localhost:8080/swagger-ui
- **Health Check:** http://localhost:8080/actuator/health
- **Info Endpoint:** http://localhost:8080/actuator/info

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
./mvnw clean install         # Build
./mvnw test                  # Run tests (uses test profile with H2)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local  # Start server (port 8080)
./mvnw clean package         # Build JAR for production
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

The backend supports multiple Spring profiles for different environments. **No default profile is set**, so you must explicitly specify the profile when running the application.

Available profiles:
- **`local`** - Local development using H2 in-memory database (no external DB required)
- **`staging`** - Staging environment with PostgreSQL (requires environment variables)
- **`prod`** - Production environment with PostgreSQL (requires environment variables)
- **`test`** - Automated testing with H2 (used by JUnit tests automatically)

#### Running with Different Profiles

**Local Development (H2):**
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
# OR
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

**Staging (PostgreSQL):**
```bash
export DB_URL=jdbc:postgresql://staging-host:5432/stagingdb
export DB_USERNAME=staging_user
export DB_PASSWORD=staging_password
export SPRING_PROFILES_ACTIVE=staging

cd backend
./mvnw spring-boot:run
```

**Production (PostgreSQL):**
```bash
export DB_URL=jdbc:postgresql://prod-host:5432/proddb
export DB_USERNAME=prod_user
export DB_PASSWORD=prod_password
export SPRING_PROFILES_ACTIVE=prod

cd backend
java -jar target/backend.jar
```

**Windows (PowerShell):**
```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/atlasiadb"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "postgres"
$env:SPRING_PROFILES_ACTIVE = "prod"

cd backend
java -jar target/backend.jar
```

#### Required Environment Variables

| Profile | Required Variables | Optional Variables |
|---------|-------------------|-------------------|
| `local` | None | `CORS_ALLOWED_ORIGINS` |
| `staging` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | `CORS_ALLOWED_ORIGINS` |
| `prod` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | `CORS_ALLOWED_ORIGINS` |
| `test` | None (H2 in-memory) | None |


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

**Backend won't start:**
```bash
# Make sure to specify a profile
export SPRING_PROFILES_ACTIVE=local  # or staging, prod
./mvnw spring-boot:run
```

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
