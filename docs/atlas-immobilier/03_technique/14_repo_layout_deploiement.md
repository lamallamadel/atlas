# Atlasia — Arborescence du projet & Déploiement (MVP)

> **Statut**: Spécification (source de vérité pour l’organisation du repo et le déploiement)  
> **Dernière mise à jour**: 2026-01-10  
> **Périmètre**: MVP Atlasia “3 sites” (Portail + Biz + Pro) + backend modulaire + infra Docker/NGINX

Ce document fixe **une seule page** de référence :  
1) l’**arborescence cible** du monorepo (structure des dossiers)  
2) l’**architecture de déploiement** recommandée (DNS → NGINX → Front/Back → DB)  
3) les **conventions de domaines** et de routage API (public vs pro)

---

## 1) Arborescence cible du monorepo

```
atlasia/
  README.md

  docs/
    PROJECT_DOCUMENTATION_INDEX.md
    PRODUCT_SPECS_SUMMARY.md
    atlas-immobilier/
      README.md
      CHANGELOG.md
      01_cadrage/
      02_fonctionnel/
      03_technique/
      04_tests/

  backend/
    README.md
    pom.xml
    src/
      main/
        java/com/atlasia/
          shared/                 # transverses: security, tenant, audit, errors
          referential/            # codes, labels, workflows, transitions
          cases/                  # dossiers/leads (B2C + B2B)
          listings/               # annonces
          appointments/           # RDV
          reports/                # signalements
          media/                  # stockage médias
          trust/                  # dedupe, scoring
        resources/
          application.yml
          db/migration/           # Flyway
      test/
        java/com/atlasia/...

  frontend/
    README.md
    src/
      app/
        core/                     # auth, http, interceptors, tenant, layouts
        shared/                   # UI kit + modèles + utilitaires
        apps/
          portal/                 # atlasia.<tld> (B2C)
          biz/                    # biz.atlasia.<tld> (corporate)
          pro/                    # pro.atlasia.<tld> (CRM)

  e2e/
    README.md
    tests/
      portal/
      biz/
      pro/

  infra/
    docker/
      docker-compose.yml
      nginx/
        portal.conf
        biz.conf
        pro.conf
        api.conf
    terraform/                    # optionnel MVP, prêt pour staging/prod
    scripts/
```

### Règles de structuration (garde-fous)
- **Monorepo unique** : une seule version produit, une seule doc, une seule CI.
- **3 sites** dans un seul workspace front : `apps/portal`, `apps/biz`, `apps/pro`.
- **Backend modulaire** (Spring) : séparation “par domaine” (cases/listings/appointments/…).
- **API publique vs pro** : séparation de contrat, pas seulement de permissions.

---

## 2) Diagramme de déploiement (MVP)

```
      DNS / TLS
         │
         ▼
 ┌────────────────┐
 │  NGINX (edge)  │
 │  - vhosts:     │
 │    atlasia.*   │
 │    biz.*       │
 │    pro.*       │
 │  - 301 www→root│
 │  - serve SPA   │
 │  - reverse API │
 └───────┬────────┘
         │
         ├──────────────► Static Front (Angular dist)
         │                 (même build, routage par hostname)
         │
         └──────────────► Backend (Spring Boot)
                           ├── /api/public/v1/*  (portail + biz)
                           ├── /api/v1/*         (pro)
                           └── /media/*          (images)
                                │
                                ▼
                           PostgreSQL
                           (multi-tenant org_id)
```

### Déploiement “simple et robuste”
- **Un seul build front** servi sur 3 hostnames.
- **NGINX** fait la terminaison TLS + reverse-proxy vers le backend.
- Les appels front se font sur **le même hostname** que le site pour éviter CORS :
  - `atlasia.<tld>/api/public/...`
  - `pro.atlasia.<tld>/api/...`

---

## 3) Conventions domaines & routage

### 3.1 Hostnames (3 sites)
- **Portail (public)** : `atlasia.<tld>`
- **Corporate** : `biz.atlasia.<tld>`
- **CRM Pro** : `pro.atlasia.<tld>`
- **Alias** : `www.atlasia.<tld>` → **301** → `atlasia.<tld>`

> Voir aussi la convention “Branding & Domaines” : `01_cadrage/04_branding_domains.md`.

### 3.2 Règles SEO (portail)
- Un seul domaine “primary” : canonical sur `atlasia.<tld>`.
- Redirections 301 stables (www → root, slug annonce → canonical).

### 3.3 Routage API
- **Public** (portail/biz) : `/api/public/v1/*`
- **Pro** : `/api/v1/*`
- **Médias** : `/media/*`

---

## 4) Checklist d’alignement (à valider avant prod)
- [ ] Les 3 vhosts (atlasia/biz/pro) servent le même `dist/` (ou 3 dist si stratégie alternative).
- [ ] `www.atlasia.<tld>` redirige en 301 vers `atlasia.<tld>`.
- [ ] Les endpoints publics sont bien isolés (`/api/public/v1`), sans fuite d’API pro.
- [ ] Les cookies/sessions (si utilisés) ne “débordent” pas entre `pro.*` et `atlasia.*`.
- [ ] Les règles “annonce publiable” sont appliquées **côté backend** (pas seulement UI).

---

## 5) Stratégie alternative (si besoin)
Si la séparation de bundles est nécessaire (performance/SEO), basculer vers **3 builds** front :
- `dist/portal`, `dist/biz`, `dist/pro` servis par vhost.
- La structure repo reste identique.
