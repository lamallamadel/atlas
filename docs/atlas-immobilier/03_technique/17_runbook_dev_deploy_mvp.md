# Runbook — Dev & Déploiement (MVP)

Ce runbook décrit le minimum pour exécuter le MVP localement et en environnement (staging/prod).

---

## 1) Topologie (MVP)
- NGINX : sert le frontend + reverse proxy API
- Backend : Spring Boot
- DB : Postgres
- (Option) Storage médias : local (dev) puis S3/MinIO

Référence : `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`

---

## 2) Domaine & routing
- Portail : `atlasia.<tld>` → `/api/public/v1/*`
- Biz : `biz.atlasia.<tld>` → `/api/public/v1/*`
- Pro : `pro.atlasia.<tld>` → `/api/v1/*`
- `www.atlasia.<tld>` : 301 vers `atlasia.<tld>`

---

## 3) Profils & configuration
### Backend
- `application-dev.yml` : dev local
- `application-test.yml` : tests
- `application-prod.yml` : prod/staging

Variables types :
- `DB_URL`, `DB_USER`, `DB_PASS`
- `JWT_ISSUER`, `JWT_JWK_SET_URI`
- `MEDIA_STORAGE_MODE` (local|s3)
- `BASE_URL_PORTAL`, `BASE_URL_PRO`, `BASE_URL_BIZ`

### Frontend
- `environment.*` : base URLs API par hostname.

---

## 4) Checklist démarrage local (MVP)
- DB up (docker)
- migrations Flyway OK
- backend up : `/actuator/health`
- frontend up (dev server ou static via nginx)
- smoke tests :
  - public search listings
  - pro login + list cases
  - submit biz demo → case créé

---

## 5) Observabilité minimale
- Correlation ID propagé (request → logs)
- `audit_event` écrit sur :
  - create listing/case
  - transitions
  - reports
- Logging niveaux :
  - prod : INFO
  - dev : DEBUG ciblé

---

## 6) Déploiement (staging/prod)
- TLS au niveau NGINX
- Protéger endpoints admin
- Rate limiting sur routes public `/leads`, `/reports`, `/demo-leads`
- Backups DB (quotidien)
