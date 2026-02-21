# Infrastructure (Docker-first)

Ce dossier fournit un environnement local complet via **Docker Compose**. Le backend est exécuté **dans Docker** (profil `elk` par défaut) et les outils d’observabilité (logs + métriques) sont inclus.

Pour le dépannage et la vérification (Kibana/Grafana/Prometheus), voir : `docs/RUNBOOK_OBSERVABILITY.md`.

## Services

- **PostgreSQL** : base de données
- **Keycloak** : IAM / OIDC (realm importé au démarrage)
- **Backend** : Spring Boot
- **Nginx** : reverse proxy (SSL via Cloudflare Origin certificates)
- **Logs** : Elasticsearch + Kibana + Logstash + Filebeat
- **Metrics** : Prometheus + Grafana
- **Adminer** : UI DB

## Démarrage

1) Copier le fichier d’environnement :

```bash
cp .env.example .env
```

2) Démarrer la stack :

```bash
docker compose up -d
```

3) Vérifier l’état :

```bash
docker compose ps
```

## URLs et ports (par défaut — local)

- Backend API: http://localhost:8080
  - Swagger UI: http://localhost:8080/swagger-ui
  - Health: http://localhost:8080/actuator/health
  - Prometheus metrics: http://localhost:8080/actuator/prometheus
- Keycloak: http://localhost:8081
- Adminer: http://localhost:8082
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

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

## OIDC / Keycloak (important)

- **Dans Docker** (backend), l’issuer doit pointer vers le service Docker :
  - `OAUTH2_ISSUER_URI=http://keycloak:8080/realms/myrealm`
- **Dans le navigateur** (frontend), l’issuer doit pointer vers l’hôte :
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
