# Infrastructure Setup

This directory contains the Docker Compose configuration for running PostgreSQL database locally.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Edit `.env` to customize database credentials and ports

3. Start the database:
   ```bash
   docker-compose up -d
   ```

4. Check the status:
   ```bash
   docker-compose ps
   ```

## Database Reset

To drop and recreate the database volume (this will delete all data):

### Linux/macOS:
```bash
chmod +x reset-db.sh
./reset-db.sh
```

### Windows (PowerShell):
```powershell
.\reset-db.ps1
```

## Configuration

The following environment variables can be configured in `.env`:

- `POSTGRES_USER`: Database username (default: postgres)
- `POSTGRES_PASSWORD`: Database password (default: postgres)
- `POSTGRES_DB`: Database name (default: myapp)
- `POSTGRES_PORT`: Host port to expose PostgreSQL (default: 5432)

## Services

### PostgreSQL
- **Image**: postgres:16-alpine
- **Port**: 5432 (configurable via POSTGRES_PORT)
- **Volume**: postgres_data (named volume for data persistence)
- **Health Check**: Automatically checks database readiness every 10 seconds

## Connection

Connect to the database using:
```
Host: localhost
Port: 5432 (or your configured POSTGRES_PORT)
Database: myapp (or your configured POSTGRES_DB)
Username: postgres (or your configured POSTGRES_USER)
Password: postgres (or your configured POSTGRES_PASSWORD)
```

Connection string format:
```
postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}
```
