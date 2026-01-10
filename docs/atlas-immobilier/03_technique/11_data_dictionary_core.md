# Dictionnaire de données — Core (MVP)

> **Statut**: TO-BE (référence)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Oui (contrat de champs/contraintes — alignement BE/FE)  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/02_modele_donnees_advanced.md`  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## Conventions
- Toutes les entités métier sont **tenant‑scopées** : champ `org_id` (UUID, NOT NULL).
- Les statuts et types “métier” doivent être des **codes** (ex: `CRM_NEW`, `COOP_GROUP_FORMATION`) et non des enums codées en dur.
- Suppression : privilégier **archive** / soft delete quand nécessaire (auditabilité).
- Téléphone : normalisation recommandée (E.164) + conservation éventuelle `phone_raw`.

---

## 1) Organisation & Sécurité

### `organisation`
| Champ | Type | Requis | Contraintes / Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK (`org_id`) |
| `name` | text | ✅ | 2..200 |
| `org_type_code` | text | ✅ | ex: `ORG_AGENCY`, `ORG_DEVELOPER` (référentiel futur) |
| `plan_key` | text | ✅ | ex: `plan.pro_starter` |
| `status_code` | text | ✅ | ex: `ORG_ACTIVE`, `ORG_SUSPENDED` |
| `settings_json` | jsonb | ❌ | seuils dédup, policies |

### `app_user`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `email` | text | ✅ | unique (par org ou global selon choix) |
| `display_name` | text | ✅ | |
| `phone` | text | ❌ | normalisé |
| `status_code` | text | ✅ | `USER_ACTIVE`, `USER_DISABLED` |
| `created_at` | timestamptz | ✅ | |

---

## 2) Annonces

### `annonce`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `status_code` | text | ✅ | ex: `ANN_DRAFT`, `ANN_PUBLISHED`, `ANN_SUSPENDED`, `ANN_ARCHIVED` (référentiel à stabiliser) |
| `transaction_type_code` | text | ✅ | ex: `TX_SALE`, `TX_RENT` |
| `title` | text | ✅ | 10..120 |
| `description` | text | ✅ | 30..5000 |
| `price_amount` | numeric | ✅ | >=0 |
| `currency_code` | text | ✅ | `MAD` défaut |
| `surface_m2` | numeric | ✅ | >0 |
| `rooms` | int | ❌ | >=0 |
| `bathrooms` | int | ❌ | >=0 |
| `amenities_json` | jsonb | ❌ | flags structurés |
| `city` | text | ✅ | |
| `zone` | text | ✅ | |
| `address_text` | text | ❌ | peut être partiellement masquée |
| `lat` / `lng` | numeric | ❌ | carte |
| `contact_name` | text | ❌ | |
| `contact_phone` | text | ❌ | |
| `meta_json` | jsonb | ❌ | déjà présent (extension sans migration) |
| `created_at` | timestamptz | ✅ | |
| `updated_at` | timestamptz | ✅ | |
| `published_at` | timestamptz | ❌ | |

### `annonce_media`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `annonce_id` | UUID | ✅ | FK |
| `media_type_code` | text | ✅ | `MEDIA_IMAGE` (MVP) |
| `storage_key` | text | ✅ | path/URL |
| `file_hash` | text | ❌ | dédup (MVP simple) |
| `created_at` | timestamptz | ✅ | |

### `annonce_report`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | org de l’annonce |
| `annonce_id` | UUID | ✅ | FK |
| `reason_code` | text | ✅ | `REPORT_DUPLICATE`, `REPORT_FRAUD`, ... |
| `comment` | text | ❌ | |
| `status_code` | text | ✅ | `REPORT_OPEN`, `REPORT_IN_REVIEW`, `REPORT_CLOSED` |
| `created_at` | timestamptz | ✅ | |

---

## 3) Dossiers (Case)

### `dossier`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `annonce_id` | UUID | ❌ | FK (optionnel) |
| `case_type_code` | text | ✅ | ex: `CRM_LEAD`, `CRM_MANDATE`, `COOP_GROUP`, ... |
| `status_code` | text | ✅ | ex: `CRM_NEW`, `CRM_QUALIFIED`, ... (workflow) |
| `source_code` | text | ✅ | ex: `LEAD_SOURCE_WHATSAPP`, `LEAD_SOURCE_FORM` |
| `contact_name` | text | ✅ | |
| `phone` | text | ✅ | normalisé |
| `email` | text | ❌ | |
| `budget_min` / `budget_max` | numeric | ❌ | |
| `assigned_to_user_id` | UUID | ❌ | FK user |
| `score` | int | ✅ | 0..100 |
| `score_reason` | text | ❌ | |
| `loss_reason_code` | text | ❌ | selon workflow (`LOSS_REASON`) |
| `won_reason_code` | text | ❌ | selon workflow (`WON_REASON`) |
| `last_activity_at` | timestamptz | ✅ | |
| `created_at` | timestamptz | ✅ | |
| `updated_at` | timestamptz | ✅ | |

> Le couple (`case_type_code`, `status_code`) doit être cohérent avec la définition de workflow active.

### `dossier_note`, `dossier_task`, `dossier_event`
- Notes : auteur, texte, date.
- Tâches : assignée, due date, statut.
- Événements : type + payload JSON (timeline).

---

## 4) RDV

### `appointment`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `dossier_id` | UUID | ✅ | FK |
| `annonce_id` | UUID | ❌ | FK |
| `appointment_type_code` | text | ✅ | `APPOINT_VISIT`, `APPOINT_CALL` |
| `status_code` | text | ✅ | `APPOINT_SCHEDULED`, `APPOINT_DONE`, `APPOINT_NO_SHOW`, `APPOINT_CANCELLED` |
| `starts_at` | timestamptz | ✅ | |
| `location_text` | text | ❌ | |
| `comment` | text | ❌ | |

---

## 5) Trust / Modération / Dédup

### `duplicate_signal`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `entity_type_code` | text | ✅ | `ENTITY_ANNONCE` / `ENTITY_DOSSIER` |
| `entity_id` | UUID | ✅ | |
| `score` | int | ✅ | 0..100 |
| `reasons_json` | jsonb | ✅ | règles déclenchées |
| `created_at` | timestamptz | ✅ | |

### `moderation_case`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `entity_type_code` | text | ✅ | |
| `entity_id` | UUID | ✅ | |
| `status_code` | text | ✅ | `MOD_PENDING`, `MOD_APPROVED`, `MOD_REJECTED`, `MOD_SUSPENDED` |
| `reason` | text | ❌ | |
| `decided_by` | UUID | ❌ | |
| `decided_at` | timestamptz | ❌ | |

---

## 6) Consentements & Audit

### `consent`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `subject_type_code` | text | ✅ | `SUBJECT_USER` / `SUBJECT_PERSON` |
| `subject_id` | UUID | ✅ | |
| `consent_type_code` | text | ✅ | `CONSENT_CONTACT`, `CONSENT_MARKETING` |
| `source_code` | text | ✅ | `CONSENT_SRC_FORM`, `CONSENT_SRC_IMPORT` |
| `captured_at` | timestamptz | ✅ | |
| `proof_json` | jsonb | ❌ | |

### `audit_event`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `id` | UUID | ✅ | PK |
| `org_id` | UUID | ✅ | tenant |
| `actor_user_id` | UUID | ✅ | |
| `action_code` | text | ✅ | ex: `ANNONCE_PUBLISHED`, `DOSSIER_ASSIGNED`, `MOD_DECIDED` |
| `entity_type_code` | text | ✅ | |
| `entity_id` | UUID | ✅ | |
| `diff_json` | jsonb | ❌ | |
| `correlation_id` | text | ❌ | |
| `created_at` | timestamptz | ✅ | |

---

## 7) Entitlements (modules / plans)

### `org_feature`
| Champ | Type | Requis | Notes |
|---|---|---:|---|
| `org_id` | UUID | ✅ | |
| `feature_key` | text | ✅ | `module.trust.basic`, ... |
| `enabled` | boolean | ✅ | |
| `limits_json` | jsonb | ❌ | quotas/limites |

