# Modèle de données — Advanced CRM (schéma présent + extensions prévues)

> **Statut**: Partiel (AS-IS) + extension TO-BE  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Principe
Le schéma PostgreSQL contient déjà les tables « Advanced CRM » afin de permettre une montée en charge progressive.
À date (Week 3), seules les APIs Annonces/Dossiers/Dashboard sont exposées, mais les entités suivantes existent en base et côté JPA.

---

## Tables / Entités « Advanced CRM » (déjà présentes)

### Message (`message`)
But : stocker les communications associées à un Dossier.
Champs (schéma actuel) :
- `id` (PK)
- `org_id` (tenant, NOT NULL)
- `dossier_id` (FK)
- `direction` (enum: `INBOUND`, `OUTBOUND`)
- `channel` (enum: `EMAIL`, `SMS`, `PHONE`, `WHATSAPP`)
- `content` (text)
- `timestamp` (date/heure métier)
- `created_at` (audit technique)

Index recommandés :
- `(org_id, dossier_id, timestamp desc)`
- `(org_id, channel, timestamp)`

### Consentement (`consentement`)
But : tracer l’opt-in/out par canal pour un Dossier (trajectoire cible : rattachement à une Partie Prenante).
Champs (schéma actuel) :
- `id`
- `org_id` (tenant, NOT NULL)
- `dossier_id` (FK)
- `channel` (EMAIL/SMS/PHONE/WHATSAPP)
- `status` (OPT_IN/OPT_OUT)
- `meta_json` (jsonb) : source, preuve, commentaire, etc.
- `created_at`, `updated_at`

Contraintes recommandées :
- Unique `(org_id, dossier_id, channel)` (un état courant par canal et dossier)
- Historique : via table d’historique ou (recommandé) via audit trail

### Audit event (`audit_event`)
But : journal immuable des changements.
Champs (schéma actuel) :
- `id`
- `org_id` (tenant, NOT NULL)
- `entity_type` (ANNONCE, DOSSIER, MESSAGE, CONSENTEMENT, )
- `entity_id`
- `action` (CREATE, UPDATE, DELETE)
- `user_id`
- `diff_json` (jsonb)
- `created_at`

Extensions prévues :
- `before_json` / `after_json`
- `correlation_id` (traçabilité request)

### Appointment (`appointment`)
But : gérer les rendez-vous et relances.
Statut : table présente (entité JPA) ; endpoints/UI à implémenter.

---

## Tables / Entités « métier » (déjà exposées)

### Annonce (`annonce`)
- entité principale « produit » / « bien »
- `meta_json` (jsonb) disponible pour enrichissements sans migration lourde

### Dossier (`dossier`)
- lead rattaché à une annonce (optionnel) + statut + scoring
- contient une collection de **Parties prenantes** (one-to-many)

### Partie prenante (`partie_prenante`)
- rattachement au Dossier
- rôle (BUYER/SELLER/AGENT/) + informations de contact (schéma aligné via migrations)


## TO-BE — Référentiels & workflows configurables (multi-tenant)

Cette section décrit les tables à introduire pour basculer des enums codés vers des référentiels tenant-scopés.

### Tables proposées (minimum viable)

- `ref_dictionary`  
  - `org_id` (nullable si global)  
  - `dict_type` (ex: CASE_TYPE, CASE_STATUS, LOSS_REASON…)  
  - `code` (clé stable)  
  - `label` / `label_fr` / `label_ar` (selon besoin)  
  - `sort_order`  
  - `is_active`  
  - `metadata_json` (optionnel)

- `workflow_definition`  
  - `org_id`  
  - `case_type_code`  
  - `version`  
  - `is_active`  
  - `updated_at`

- `workflow_state`  
  - `workflow_id`  
  - `status_code`  
  - `is_terminal`  
  - `requires_reason_type` (NONE / LOSS / WON)

- `workflow_transition`  
  - `workflow_id`  
  - `from_status_code`  
  - `to_status_code`  
  - `required_role` (optionnel)  
  - `guard_json` (pré-conditions, optionnel)

### Migration des dossiers existants
- Introduire `case_type_code` sur `dossier` (default)
- Remplacer le statut enum par `status_code` (string)
- Backfill sur les valeurs existantes

---

## Extensions TO-BE — Coop Habitat (groupement)

> **Statut** : TO-BE (non implémenté)  
> **Source of truth** : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`

Objectif : ajouter un sous-domaine “coopérative/groupement” en conservant les principes existants :
- multi-tenancy via `org_id`,
- audit + timeline,
- notifications outbound via outbox.

### Entités (proposées)

#### Groupement (`coop_group`)
- `id`, `org_id`
- `name`, `city`
- `status_code` (FORMATION/KYC_READY/FUNDING_OPEN/…)
- `rules_json` (FIFO, indexation, pénalités, cut-off)
- `created_at`, `updated_at`

Index :
- `(org_id, status_code)`
- `(org_id, created_at desc)`

#### Projet (`coop_project`)
- `id`, `org_id`, `group_id` (FK)
- `status_code` (LAND_SECURED/PERMITS/BUILDING/DELIVERY/HANDOVER/CLOSED)
- `budget_total`, `budget_json` (optionnel)
- `milestones_json` (optionnel)
- `created_at`, `updated_at`

#### Lot (`coop_lot`)
- `id`, `org_id`, `project_id` (FK)
- `code` (A1, B2…), `type`, `surface`, `floor`, `price_reference` (optionnel)
- `status_code` (AVAILABLE/RESERVED/ASSIGNED/DELIVERED)
- `created_at`, `updated_at`

#### Membre (`coop_member`)
- `id`, `org_id`, `group_id` (FK)
- `display_name`, `phone`, `email`
- `member_status` (PENDING_KYC/ACTIVE/SUSPENDED/EXITED/EXCLUDED)
- `fifo_rank` (int, unique par group)
- `kyc_json` (pièces, statut)
- `created_at`, `updated_at`

Contraintes :
- unique `(org_id, group_id, fifo_rank)`
- index `(org_id, group_id, member_status)`

#### Plan de cotisation (`coop_contribution_plan`)
- `id`, `org_id`, `group_id` (FK)
- `version` (int)
- `formula_json` (indexation, pénalités)
- `schedule_json` (échéancier)
- `effective_from`
- `created_at`, `updated_at`

#### Contributions / ledger (`coop_contribution`)
- `id`, `org_id`, `group_id`, `member_id`
- `due_date`, `amount_due`
- `paid_date`, `amount_paid`
- `method` (BANK_TRANSFER/CASH/…)
- `status` (`APPT_PENDING`/`APPT_CONFIRMED`/`APPT_REJECTED`/`APPT_LATE`/`APPT_WAIVED`)  
  > Statuts techniques d’Appointment (distincts du workflow dossier).
- `proof_document_id` (FK document)
- `created_at`, `updated_at`

Index :
- `(org_id, group_id, due_date)`
- `(org_id, member_id, due_date)`

#### Allocation (`coop_allocation`)
- `id`, `org_id`, `group_id`, `project_id`, `lot_id`, `member_id`
- `status_code` (`COOP_ALLOC_PROPOSED`/`COOP_ALLOC_APPROVED`/`COOP_ALLOC_ASSIGNED`/`COOP_ALLOC_SIGNED`/`COOP_ALLOC_CANCELLED`)  
  > Statuts métier (référentiel) — voir `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`.
- `decision_document_id` (PV)
- `validated_at`, `assigned_at`
- `created_at`, `updated_at`

Contraintes :
- unique `(org_id, lot_id)` si un lot ne peut être assigné qu’une fois.

#### Documents (`document`)
Réutiliser une table générique (si existante) ou ajouter :
- `id`, `org_id`
- `entity_type` (COOP_GROUP/COOP_PROJECT/COOP_MEMBER/COOP_ALLOCATION/…)
- `entity_id`
- `type` (PV, CONTRACT, PAYMENT_PROOF, …)
- `storage_ref` (S3/minio/local), `hash`, `created_at`

> Les tables `audit_event` et `activity` doivent tracer toutes les opérations critiques (voir docs audit/timeline).