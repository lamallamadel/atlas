# Modèle de données — MVP (DB Schema)

Ce document définit le **minimum DB** pour exécuter le MVP (portail + biz + pro).
Il complète :
- `docs/atlas-immobilier/03_technique/02_modele_donnees_advanced.md`
- `docs/atlas-immobilier/03_technique/11_data_dictionary_core.md`

---

## 1) Principes
- Multi-tenant : toutes les tables “métier” portent `org_id` (sauf référentiels globaux si choisis).
- Audit : événements append-only (idempotence, traçabilité).
- Workflows : `status_code` + `transition_code` (source : référentiel).

---

## 2) Tables MVP

### 2.1 `listing`
Champs (minimum) :
- `id` (PK)
- `org_id`
- `status_code` (ANN_*)
- `tx` (SALE/RENT ou code)
- `slug`
- `title`, `description`
- `price`, `currency`
- `city`, `zone`, `address_text`
- `lat`, `lng`
- `surface_m2`, `rooms`, `bathrooms`
- `quality_score` (0..100)
- `duplicate_score` (0..100)
- `published_at`, `created_at`, `updated_at`

Index recommandés :
- `(org_id, status_code)`
- `(status_code, published_at desc)` (public read)
- `slug` (unique avec `id` ou unique par listing)
- `(city, zone, tx, price)` (search basique)

---

### 2.2 `listing_media`
- `id` (PK)
- `listing_id` (FK)
- `org_id`
- `url` (ou `storage_key`)
- `type` (IMAGE)
- `is_primary` (bool)
- `sort_order` (int)
- `file_hash` (sha256, pour dedupe médias)
- `created_at`

Index :
- `(listing_id, sort_order)`
- `(listing_id, is_primary)`

---

### 2.3 `report`
- `id` (PK)
- `listing_id` (FK, nullable si reports génériques)
- `org_id` (nullable si report public “sans org” ; sinon rempli via listing)
- `reason_code` (REPORT_*)
- `status_code` (REPORT_OPEN/CLOSED)
- `comment`
- `reporter_phone`, `reporter_email` (optionnel)
- `created_at`, `updated_at`

Index :
- `(listing_id, status_code)`
- `(status_code, created_at desc)`

---

### 2.4 `case` (CRM)
- `id` (PK)
- `org_id`
- `case_type_code` (ex: CASE_TYPE_LEAD_B2B_DEMO)
- `status_code` (B2B_*)
- `source_code` (LEAD_SOURCE_*)
- `assignee_user_id` (nullable)
- `title` (option)
- `payload_json` (qualification, needs, plan, utm)
- `lost_reason_code` (nullable)
- `created_at`, `updated_at`, `last_activity_at`

Index :
- `(org_id, case_type_code, status_code)`
- `(org_id, assignee_user_id, status_code)`
- `(created_at desc)`

---

### 2.5 `appointment`
- `id` (PK)
- `org_id`
- `case_id` (FK)
- `starts_at`, `ends_at`
- `status_code` (SCHEDULED/DONE/CANCELLED)
- `location` (text)
- `created_at`, `updated_at`

Index :
- `(case_id)`
- `(org_id, starts_at)`

---

### 2.6 `audit_event`
- `id` (PK)
- `org_id` (nullable si public)
- `entity_type` (LISTING/CASE/REPORT/...)
- `entity_id`
- `event_type` (LISTING_CREATED, TRANSITION_APPLIED, ...)
- `payload_json`
- `actor_user_id` (nullable public)
- `correlation_id`
- `created_at`

Index :
- `(org_id, entity_type, entity_id, created_at desc)`

---

### 2.7 `referential_code` (option MVP, si codes stockés en DB)
- `id`
- `namespace` (CASE_TYPE, B2B_STATUS, ANN_STATUS, ...)
- `code`
- `label_fr`
- `is_active`

Si référentiel en fichier (YAML) : table optionnelle.

---

## 3) Règles de cohérence
- Toute transition modifie `status_code` + écrit un `audit_event`.
- Les endpoints public lisent uniquement `listing.status_code = ANN_PUBLISHED`.
- Les reports publics peuvent déclencher une action pro (suspension) via workflow.

---

## 4) Migration & seed (MVP)
- Migrations Flyway : création tables + index.
- Seed minimal : référentiels MVP (si DB).
