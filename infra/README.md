# Infrastructure (Docker-first)

Ce dossier fournit un environnement local complet via **Docker Compose**. Le backend est exécuté **dans Docker** (profil `elk` par défaut) et les outils d'observabilité (logs + métriques) sont inclus.

Pour le dépannage et la vérification (Kibana/Grafana/Prometheus), voir : `docs/RUNBOOK_OBSERVABILITY.md`.

## Services

- **PostgreSQL** : base de données
- **Keycloak** : IAM / OIDC (realm importé au démarrage)
- **Backend** : Spring Boot (Java 25)
- **Brain** : FastAPI monolithe AI (scoring, dupli, fraud, match, proposal, nego, agent, document)
- **Nginx** : reverse proxy (SSL via Cloudflare Origin certificates)
- **Logs** : Elasticsearch + Kibana + Logstash + Filebeat
- **Metrics** : Prometheus + Grafana
- **Adminer** : UI DB

## Compose Files

| Fichier | Usage | Description |
|---------|-------|-------------|
| `docker-compose.yml` | Production/Staging | Stack complète avec PostgreSQL, Keycloak, ELK, Prometheus/Grafana |
| `docker-compose.local.yml` | Dev local | Stack légère avec H2, sans Keycloak/ELK, frontend dev server |
| `docker-compose.e2e-postgres.yml` | E2E tests | Override de production pour Playwright E2E |
| `docker-compose-analytics.yml` | Analytics | Stack analytics optionnelle |

## Démarrage

### Production/Staging

1) Copier le fichier d'environnement :

```bash
cp .env.example .env
```

2) Démarrer la stack :

```bash
docker compose up -d
```

3) Vérifier l'état :

```bash
docker compose ps
```

### Développement local

```bash
docker compose -f docker-compose.local.yml up
```

## URLs et ports (par défaut — local)

### Stack production (`docker-compose.yml`)

| Service | URL | Notes |
|---------|-----|-------|
| Backend API | http://localhost:8080 | Spring Boot |
| Swagger UI | http://localhost:8080/swagger-ui | API docs |
| Health | http://localhost:8080/actuator/health | Actuator |
| Keycloak | http://localhost:8081 | IAM |
| Adminer | http://localhost:8082 | DB UI |
| Brain AI | http://localhost:8000 | FastAPI monolith |
| Elasticsearch | http://localhost:9200 | Search engine |
| Kibana | http://localhost:5601 | Log explorer |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3000 | Dashboards |

### Stack locale (`docker-compose.local.yml`)

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost | Via Nginx |
| Frontend Dev | http://localhost:4200 | Angular dev server direct |
| Backend API | http://localhost:8080 | Spring Boot |
| H2 Console | http://localhost:8083 | DB web UI |
| Brain AI | http://localhost:8000 | FastAPI monolith |
| llama.cpp | http://localhost:8008 | Local LLM (optionnel, `--profile llama`) |

## URLs production (via Nginx + Cloudflare)

| Subdomain | Service | Description |
|---|---|---|
| `afroware.app` | Frontend + API | Angular SPA (`/`) + Backend (`/api/`, `/actuator/`) |
| `api.afroware.app` | Backend | Accès direct à l'API Spring Boot |
| `identity.afroware.app` | Keycloak | IAM / OIDC |
| `db.afroware.app` | Adminer | Administration base de données |
| `grafana.afroware.app` | Grafana | Dashboards de monitoring |
| `logs.afroware.app` | Kibana | Exploration des logs |

### SSL / Cloudflare

- SSL est terminé par Cloudflare (mode **Full Strict**)
- Les certificats Origin Cloudflare sont montés sur le serveur : `/etc/ssl/cloudflare/fullchain.pem` et `/etc/ssl/cloudflare/privkey.pem`
- Le certificat doit couvrir `*.afroware.app` + `afroware.app` (wildcard)
- Nginx écoute sur les ports `80` (redirect HTTPS) et `443` (SSL)

## Nginx Routing

### Production (`nginx.conf`)

```
/            → Static Angular SPA (try_files)
/api/        → Backend Spring Boot
/actuator/   → Backend actuator
/brain/      → Brain FastAPI monolith (strip prefix)
/health      → Nginx health check (200 OK)
```

### Local (`nginx-local.conf`)

```
/            → Frontend Angular dev server (WebSocket proxy)
/api/        → Backend Spring Boot
/actuator/   → Backend actuator
/brain/      → Brain FastAPI monolith (strip prefix)
/health      → Nginx health check (200 OK)
```

## OIDC / Keycloak (important)

- **Dans Docker** (backend), l'issuer doit pointer vers le service Docker :
  - `OAUTH2_ISSUER_URI=http://keycloak:8080/realms/myrealm`
- **Dans le navigateur** (frontend), l'issuer doit pointer vers l'hôte :
  - `http://localhost:8081/realms/myrealm`

## Logs (ELK)

- Le backend (profil `elk`) écrit des logs JSON dans : `/var/log/atlas/application.json` (volume `backend_logs`).
- **Filebeat** lit ce fichier et expédie vers **Logstash**.
- **Logstash** indexe dans Elasticsearch : `atlas-logs-YYYY.MM.dd`.

Dans Kibana, créer une *Data View* :
- Pattern: `atlas-logs-*`
- Time field: `@timestamp`

## Metrics (Prometheus / Grafana)

- Prometheus scrappe le backend sur `/actuator/prometheus`.
- Grafana est provisionné (datasource Prometheus + dashboards).

Identifiants Grafana (par défaut) :
- user: `admin`
- password: `admin`

## Reset (attention: destructif)

- Reset total (supprime les volumes) :

```bash
docker compose down -v
```

- Reset DB uniquement :
  - Linux/macOS: `./reset-db.sh`
  - Windows: `./reset-db.ps1`
