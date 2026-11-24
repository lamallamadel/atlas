# 🚀 Production Deployment Guide - Hetzner

**Date**: 2026-02-19  
**Target**: Hetzner VPS/Cloud Server  
**Stack**: Docker Compose (all-in-one) → Future: Kubernetes  
**Environment**: Production (SPRING_PROFILES_ACTIVE=prod)

---

## 1. Prerequisites

### Your Setup (From Config)
- ✅ GitHub repo: `https://github.com/lamallamadel/atlas.git`
- ✅ Infrastructure: `infra/docker-compose.yml`
- ✅ All services defined (backend, postgres, redis, keycloak, ELK, brain services)
- ✅ CI/CD ready (GitHub Actions)

### Hetzner Requirements

**Server Specs (Recommended)**:
- CPU: 4 vCPU (for app + monitoring)
- RAM: 16 GB (8GB backend + 4GB DB + 2GB cache + 2GB brain services)
- Disk: 100 GB SSD (OS + data)
- Network: 1 Gbps (sufficient for MVP)

**Server OS**: Ubuntu 22.04 LTS (or latest)

**Tools to Install**:
- Docker (latest)
- Docker Compose (v2.x)
- Git
- curl
- wget

---

## 2. Hetzner Server Setup (First Time)

### 2.1 Connect to Server

```bash
ssh root@<your-hetzner-ip>
# Or if you set up SSH key:
ssh -i ~/.ssh/hetzner_key root@<your-hetzner-ip>
```

### 2.2 Update System

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git build-essential
```

### 2.3 Install Docker

```bash
# Remove old Docker (if any)
apt-get remove docker docker-engine docker.io containerd runc -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Allow root user
usermod -aG docker root
newgrp docker

# Verify
docker --version
docker run hello-world
```

### 2.4 Install Docker Compose

```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 2.5 Create App Directory

```bash
mkdir -p /opt/atlas
cd /opt/atlas
chmod 755 /opt/atlas
```

---

## 3. Deploy from GitHub

### 3.1 Clone Repository

```bash
cd /opt/atlas
git clone https://github.com/lamallamadel/atlas.git .

# Verify clone
ls -la
# Should see: backend/, frontend/, brain/, infra/, .github/, etc.
```

### 3.2 Checkout Latest Release Tag (or master)

```bash
# Option A: Use latest release tag
git fetch --tags
git checkout $(git describe --tags --abbrev=0)

# Option B: Use master branch
git checkout master
git pull origin master
```

---

## 4. Production Configuration

### 4.1 Create .env for Production

```bash
cd /opt/atlas/infra
cp .env.example .env
```

**Edit** `.env` with production values:

```env
# ═════════════════════════════════════════════════════════════════════════════
# PRODUCTION CONFIGURATION
# ═════════════════════════════════════════════════════════════════════════════

# --- PostgreSQL (Production) ---
POSTGRES_DB=atlas_prod
POSTGRES_USER=atlas_prod_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)  # Generate strong password!
POSTGRES_PORT=5432

# --- Redis (Production) ---
REDIS_PORT=6379
REDIS_MAX_MEMORY=4gb
CACHE_REDIS_ENABLED=true

# --- Keycloak (Production) ---
KEYCLOAK_PORT=8081
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)  # Generate!

# --- Backend (Production) ---
BACKEND_PORT=8080
SPRING_PROFILES_ACTIVE=prod
# CORS: Your actual domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# OIDC: Use your actual domain
OAUTH2_ISSUER_URI=https://yourdomain.com:8081/realms/myrealm
OAUTH2_JWK_SET_URI=https://yourdomain.com:8081/realms/myrealm/protocol/openid-connect/certs

# Database credentials (backend will use)
DB_URL=jdbc:postgresql://postgres:5432/atlas_prod
DB_USERNAME=atlas_prod_user
DB_PASSWORD=$(openssl rand -base64 32)  # Same as POSTGRES_PASSWORD

# --- Elasticsearch (Production) ---
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URIS=http://elasticsearch:9200
ES_HTTP_PORT=9200

# --- Monitoring ---
KIBANA_PORT=5601
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)

# --- Brain AI Services ---
BRAIN_API_KEY=$(openssl rand -base64 32)  # Generate!
BRAIN_SCORING_PORT=8000
BRAIN_DUPLI_PORT=8001
BRAIN_FRAUD_PORT=8002

# --- App Metadata ---
APP_ENV=production
```

### 4.2 Generate Secure Passwords

```bash
# Run these and copy output into .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)"
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)"
echo "BRAIN_API_KEY=$(openssl rand -base64 32)"
```

### 4.3 Security: Set Up SSL/TLS (NGINX Reverse Proxy)

Create `infra/nginx.conf`:

```nginx
upstream backend {
    server backend:8080;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to backend
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (static files)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

Add NGINX to `infra/docker-compose.yml`:

```yaml
nginx:
  image: nginx:1.27-alpine
  container_name: nginx_prod
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - ./frontend-build:/usr/share/nginx/html:ro
  depends_on:
    - backend
  restart: unless-stopped
```

### 4.4 Set Up Let's Encrypt SSL

```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate (stop docker first)
docker compose down
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Restart services
docker compose up -d
```

---

## 5. Build & Push Docker Images

### 5.1 Build Images on Hetzner (or Pre-built)

**Option A: Build locally on Hetzner**
```bash
cd /opt/atlas

# Build backend image
docker build -f backend/Dockerfile.optimized -t atlas-backend:prod .

# Build brain services
docker build -f brain/scoring-service/Dockerfile -t atlas-brain-scoring:prod .
docker build -f brain/dupli-service/Dockerfile -t atlas-brain-dupli:prod .
docker build -f brain/fraud-service/Dockerfile -t atlas-brain-fraud:prod .
```

**Option B: Push to Docker Hub / Registry (Recommended for larger deployments)**
```bash
# Build locally on your machine
docker build -f backend/Dockerfile.optimized -t yourregistry/atlas-backend:prod .
docker push yourregistry/atlas-backend:prod

# Then on Hetzner, docker compose will pull automatically
```

### 5.2 Update docker-compose.yml for Production

Replace image references:

```yaml
backend:
  image: atlas-backend:prod        # or yourregistry/atlas-backend:prod
  build: ../backend/Dockerfile.optimized
  container_name: backend_prod
  # ... rest of config
  environment:
    SPRING_PROFILES_ACTIVE: prod
    # ... all prod env vars
```

---

## 6. Start Production Services

### 6.1 Verify Configuration

```bash
cd /opt/atlas/infra

# Check .env is set correctly
cat .env | grep -E "^[^#]"

# Validate docker-compose
docker-compose config
```

### 6.2 Start All Services

```bash
# Pull/build images
docker compose build

# Start in background
docker compose up -d

# Wait for services to be healthy (30-60 seconds)
sleep 30

# Check status
docker compose ps

# Should see all services with "healthy" status
```

### 6.3 Verify Services Are Running

```bash
# Check backend is responding
curl http://localhost:8080/actuator/health

# Check Keycloak
curl http://localhost:8081/auth/admin/realms/myrealm

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check brain services
curl http://localhost:8001/health    # scoring
curl http://localhost:8002/health    # fraud
curl http://localhost:8003/health    # dupli
```

---

## 7. Database Initialization

### 7.1 Run Flyway Migrations

Migrations run automatically on backend startup. Check logs:

```bash
docker compose logs -f backend | grep -i flyway
```

Expected output:
```
Successfully validated 39 migrations
Executing migration: V1__Create_base_schema.sql
Executing migration: V38__Add_ai_score_to_annonce.sql
Executing migration: V39__Add_fraud_score_to_annonce.sql
```

### 7.2 Seed Reference Data

```bash
# Backend automatically seeds on startup (referential.seed-on-missing=true)
docker compose logs backend | grep -i "seed"
```

---

## 8. Post-Deployment Verification

### 8.1 Health Checks

```bash
#!/bin/bash
echo "=== Backend Health ==="
curl -s http://localhost:8080/actuator/health | jq .

echo "=== Database Health ==="
docker exec postgres_prod psql -U atlas_prod_user -d atlas_prod -c "SELECT version();"

echo "=== Redis Health ==="
docker exec redis_prod redis-cli ping

echo "=== Keycloak Health ==="
curl -s http://localhost:8081/health | jq .

echo "=== Elasticsearch Health ==="
curl -s http://localhost:9200/_cluster/health | jq .
```

### 8.2 Check Logs

```bash
# Backend logs
docker compose logs backend --tail 50

# All services
docker compose logs --tail 50
```

### 8.3 API Smoke Test

```bash
# Create test listing
curl -X POST http://localhost:8080/api/v1/listings \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: org-123" \
  -d '{
    "titre": "Test Property",
    "prix": 500000,
    "surface": 150
  }'

# Should return 201 with listing ID
```

---

## 9. Monitoring & Logs

### 9.1 View Logs in Kibana

```
http://yourdomain.com:5601

# Default credentials
username: elastic
password: (check docker-compose.yml)
```

### 9.2 Prometheus Metrics

```
http://yourdomain.com:9090

# Query examples:
- http_server_requests_seconds_bucket
- brain_scoring_requests_total
- jvm_memory_used_bytes
```

### 9.3 Grafana Dashboards

```
http://yourdomain.com:3000

# Login: admin / (password from .env)
# Add Prometheus datasource: http://prometheus:9090
```

---

## 10. Backup & Recovery

### 10.1 Database Backup

```bash
# Manual backup
docker exec postgres_prod pg_dump -U atlas_prod_user atlas_prod > /backups/atlas_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (cron)
0 2 * * * docker exec postgres_prod pg_dump -U atlas_prod_user atlas_prod > /backups/atlas_$(date +\%Y\%m\%d_%H\%M\%S).sql

# Keep only last 30 days
find /backups -name "atlas_*.sql" -mtime +30 -delete
```

### 10.2 Database Restore

```bash
# Restore from backup
docker exec -i postgres_prod psql -U atlas_prod_user atlas_prod < /backups/atlas_20260219_020000.sql
```

### 10.3 Volume Backups

```bash
# Backup Elasticsearch data
docker run --rm -v atlas_elasticsearch_data:/data -v /backups:/backup \
  alpine tar czf /backup/elasticsearch_$(date +%Y%m%d).tar.gz -C /data .

# Backup Postgres data
docker run --rm -v atlas_postgres_data:/data -v /backups:/backup \
  alpine tar czf /backup/postgres_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 11. Scaling & Performance

### 11.1 Load Balancing (Future)

When you need multiple backend instances:

```yaml
# Use nginx as load balancer
upstream backend_pool {
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}
```

### 11.2 Resource Limits

Add to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 11.3 Database Connection Pooling

Already configured (Hikari):
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

---

## 12. Troubleshooting

### Port Already in Use

```bash
# Find what's using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase swap (if needed)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Service Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 13. Deployment Checklist

- [ ] Hetzner server created + SSH access verified
- [ ] Docker + Docker Compose installed
- [ ] Repository cloned to `/opt/atlas`
- [ ] `.env` configured with production values
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] NGINX reverse proxy configured
- [ ] Docker images built / pulled
- [ ] `docker compose up -d` successful
- [ ] All services healthy (docker compose ps)
- [ ] Database migrations completed (Flyway)
- [ ] API smoke test passed
- [ ] Logs visible in Kibana
- [ ] Metrics visible in Prometheus
- [ ] Backups scheduled (cron)
- [ ] Monitoring alerts configured

---

## 14. Quick Start Commands (Copy-Paste)

```bash
# SSH to server
ssh root@<hetzner-ip>

# Go to app directory
cd /opt/atlas

# Pull latest code
git pull origin master

# Restart services
docker compose restart

# View logs
docker compose logs -f backend

# Stop everything
docker compose down

# Start everything
docker compose up -d

# Check status
docker compose ps
```

---

## 15. Support & Monitoring

### Continuous Monitoring

```bash
# Run this on your monitoring machine (not Hetzner)
watch -n 5 'ssh root@<hetzner-ip> "docker compose ps"'
```

### Alert Setup (Optional)

- Configure Slack/email alerts in Prometheus
- Set up health check pings to monitoring service
- Use Grafana to create dashboards for stakeholders

---

**Status**: 🚀 Ready for production deployment  
**Estimated Deployment Time**: 30-45 minutes  
**Downtime**: ~2 minutes (during docker compose restart)

Next steps: Follow section 2 to section 6, then verify with section 8.

Let me know if you have questions ! 🎯
