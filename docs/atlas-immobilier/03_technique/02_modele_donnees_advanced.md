# Modèle de données — Advanced CRM (schéma présent + extensions prévues)

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
- `entity_type` (ANNONCE, DOSSIER, MESSAGE, CONSENTEMENT, ...)
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
- rôle (BUYER/SELLER/AGENT/...) + informations de contact (schéma aligné via migrations)

