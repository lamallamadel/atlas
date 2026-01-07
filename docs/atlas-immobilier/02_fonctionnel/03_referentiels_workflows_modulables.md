# Référentiels & Workflows modulables (multi-métiers immobilier)

> **Statut**: TO-BE (cible MVP market-ready)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour la taxonomie et les templates de workflows)  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`  
- `docs/atlas-immobilier/03_technique/02_modele_donnees_advanced.md`

## Objectif

Permettre à Atlas Immobilier d’être **modulable par métier** (vente, location, mandat, construction, etc.) en évitant de figer les enums métier dans le code.

Le principe : les “enums métier” deviennent des **référentiels tenant-scopés** en base + un **workflow configurable** par type de dossier.

## AS-IS (aujourd’hui)

- Le dossier possède un statut géré par une logique de transitions côté backend.
- Le set des statuts est essentiellement **codé** (enum/validation).
- L’UI présente les statuts et transitions selon l’implémentation.

## TO-BE (cible)

### 1) Dossier = Case universel
Un dossier (case) représente une affaire/processus dans le temps : lead, transaction, mandat, projet…

Champs structurants :
- `caseType` : type métier (vente, location, mandat, projet…)
- `statusCode` : statut courant (appartenant au workflow du type)
- `lossReason` / `wonReason` : requis à la clôture
- `source` : provenance du lead/case (WhatsApp, Avito…)

### 2) Référentiels (dictionnaires)
Tous les éléments métier configurables sont en data (et tenant-scopés) :
- Types de dossiers (CASE_TYPE)
- Statuts (CASE_STATUS)
- Raisons perte/gain (LOSS_REASON / WON_REASON)
- Sources (LEAD_SOURCE)
- Types RDV, outcomes, types d’activités, catégories de tâches…

### 3) Workflows
Un workflow est défini par :
- États autorisés (subset du pool CASE_STATUS)
- Transitions autorisées (from → to)
- Règles (terminalité, justification, rôles, pré-conditions)

L’UI n’affiche **que** les transitions atteignables depuis l’état courant.

---

# Référentiels — socle (codes stables)

## A) CASE_TYPE (types de dossiers)
- `LEAD_BUY` — Prospect Achat  
- `LEAD_RENT` — Prospect Location  
- `OWNER_LEAD` — Prospect Propriétaire (vendre/louer)  
- `SALE_TRANSACTION` — Transaction Vente  
- `RENTAL_TRANSACTION` — Transaction Location  
- `MANDATE_SALE` — Mandat Vente  
- `MANDATE_RENT` — Mandat Location / Gestion  
- `PROPERTY_LISTING` — Fiche Bien / Listing (interne)  
- `PROJECT_CONSTRUCTION` — Projet Construction  
- `PROJECT_RENOVATION` — Projet Rénovation  
- `INVESTOR_CASE` — Dossier Investisseur  
- `SUPPORT_DISPUTE` — Litige / SAV  

## B) CASE_STATUS (pool de statuts)
### Entrée / tri / contact
`NEW`, `TRIAGED`, `CONTACTED`, `UNREACHABLE`, `QUALIFIED`, `DISQUALIFIED`, `ON_HOLD`, `REASSIGNED`

### Visite / relance
`VISIT_PLANNED`, `VISIT_DONE`, `NO_SHOW`, `FOLLOW_UP`

### Offre / négociation
`OFFER_REQUESTED`, `OFFER_RECEIVED`, `NEGOTIATION`, `COUNTER_OFFER`

### Conformité (location)
`DOCS_REQUESTED`, `DOCS_RECEIVED`, `SCREENING`, `APPROVED`, `REJECTED`

### Signature / clôture
`SIGNING_SCHEDULED`, `SIGNING_IN_PROGRESS`, `CLOSED_WON`, `CLOSED_LOST`

### Listing / mandat
`MANDATE_PENDING`, `MANDATE_SIGNED`, `VALUATION_DONE`, `LISTED`, `PAUSED`, `ARCHIVED`

### Projet
`IDEA`, `FEASIBILITY`, `DESIGN`, `PERMITS`, `CONTRACTING`, `BUILDING`, `DELIVERY`

### Vente (optionnels, utiles)
`COMPROMISE_SIGNED`, `FINANCING`

## C) LOSS_REASON / WON_REASON
**LOSS_REASON** : `PRICE_TOO_HIGH`, `NOT_INTERESTED`, `COMPETITOR`, `NO_RESPONSE`, `FINANCING_ISSUE`, `DOCS_INCOMPLETE`,
`OWNER_CHANGED_MIND`, `PROPERTY_UNAVAILABLE`, `REQUIREMENTS_MISMATCH`, `TIMELINE_TOO_LONG`, `FRAUD_RISK`, `OTHER`

**WON_REASON** : `SIGNED`, `RESERVED`, `DEPOSIT_PAID`, `SOLD`, `RENTED`, `PROJECT_DELIVERED`, `OTHER`

## D) LEAD_SOURCE (sources)
`WHATSAPP`, `PHONE_CALL`, `SMS`, `EMAIL`, `FACEBOOK`, `INSTAGRAM`, `AVITO`, `MUBAWAB`, `WEBSITE`, `WALK_IN`, `REFERRAL`, `PARTNER`, `OTHER`

## E) RDV / activités
**APPOINTMENT_TYPE** : `PHONE_CALL`, `OFFICE_MEETING`, `PROPERTY_VISIT`, `OWNER_VISIT`, `NOTARY_MEETING`, `SIGNING`, `SITE_VISIT`, `VIDEO_CALL`  
**APPOINTMENT_OUTCOME** : `DONE`, `CANCELLED`, `RESCHEDULED`, `NO_SHOW`, `PARTIAL`, `OTHER`  

**ACTIVITY_TYPE** : `NOTE`, `TASK`, `STATUS_CHANGE`, `MESSAGE_LOG`, `APPOINTMENT_LOG`, `DOCUMENT_LOG`, `SYSTEM`  
**TASK_CATEGORY** : `CALL_BACK`, `SEND_MESSAGE`, `REQUEST_DOCS`, `REVIEW_DOCS`, `PREPARE_VISIT`, `FOLLOW_UP_VISIT`, `NEGOTIATE`, `SCHEDULE_SIGNING`, `OTHER`

---

# Templates de workflows (par CASE_TYPE)

## 1) LEAD_RENT (Prospect Location)
Chemin nominal :  
`NEW → TRIAGED → CONTACTED → QUALIFIED → VISIT_PLANNED → VISIT_DONE → DOCS_REQUESTED → DOCS_RECEIVED → SCREENING → APPROVED → SIGNING_SCHEDULED → CLOSED_WON`

Branches :
- `CONTACTED → UNREACHABLE → CONTACTED`
- `VISIT_PLANNED → NO_SHOW → FOLLOW_UP → VISIT_PLANNED`
- `SCREENING → REJECTED → CLOSED_LOST`
- `QUALIFIED → ON_HOLD → QUALIFIED`

## 2) LEAD_BUY (Prospect Achat)
Chemin nominal :  
`NEW → CONTACTED → QUALIFIED → VISIT_PLANNED → VISIT_DONE → OFFER_REQUESTED → OFFER_RECEIVED → NEGOTIATION → SIGNING_SCHEDULED → CLOSED_WON`  
Branches : `NEGOTIATION ↔ COUNTER_OFFER`, `QUALIFIED → ON_HOLD → QUALIFIED`

## 3) OWNER_LEAD (Prospect Propriétaire)
`NEW → CONTACTED → QUALIFIED → VALUATION_DONE → MANDATE_PENDING → MANDATE_SIGNED → LISTED`  
Branches : `LISTED ↔ PAUSED`, `LISTED → ARCHIVED`, `MANDATE_PENDING → CLOSED_LOST`

## 4) SALE_TRANSACTION (Transaction Vente)
`NEW → MANDATE_SIGNED → LISTED → (VISIT_PLANNED/VISIT_DONE cycle) → OFFER_RECEIVED → NEGOTIATION → COMPROMISE_SIGNED → FINANCING → SIGNING_SCHEDULED → CLOSED_WON`

## 5) RENTAL_TRANSACTION (Transaction Location)
`NEW → QUALIFIED → VISIT_DONE → DOCS_REQUESTED → DOCS_RECEIVED → SCREENING → APPROVED → SIGNING_SCHEDULED → CLOSED_WON`  
Branche : `SCREENING → REJECTED → CLOSED_LOST`

## 6) MANDATE_SALE / MANDATE_RENT
`VALUATION_DONE → MANDATE_PENDING → MANDATE_SIGNED → LISTED → (PAUSED ↔ LISTED) → ARCHIVED`

## 7) PROJECT_CONSTRUCTION
`IDEA → FEASIBILITY → DESIGN → PERMITS → CONTRACTING → BUILDING → DELIVERY → CLOSED_WON`  
Branches : `ON_HOLD`, `CLOSED_LOST`

## 8) PROJECT_RENOVATION
`IDEA → FEASIBILITY → DESIGN → CONTRACTING → BUILDING → DELIVERY → CLOSED_WON`

## 9) INVESTOR_CASE
`NEW → CONTACTED → QUALIFIED → OFFER_RECEIVED → NEGOTIATION → SIGNING_SCHEDULED → CLOSED_WON`

## 10) SUPPORT_DISPUTE
`NEW → TRIAGED → CONTACTED → QUALIFIED → FOLLOW_UP → CLOSED_WON / CLOSED_LOST`

---

# Politiques transverses (obligatoires)

1) `CLOSED_LOST` exige `LOSS_REASON`  
2) `CLOSED_WON` exige `WON_REASON`  
3) Outbound (`DIRECTION=OUTBOUND`) via `WHATSAPP/SMS/EMAIL` exige consentement `GRANTED`  
4) Toute transition statut crée automatiquement :
- status history
- audit event
- activity `STATUS_CHANGE`

---

# Migration (du AS-IS vers TO-BE)

Approche recommandée :
1) Introduire `caseType` (valeur par défaut `LEAD_BUY`/`LEAD_RENT` selon usage)  
2) Remplacer l’enum `DossierStatus` par `statusCode` (string) tout en gardant la compatibilité  
3) Introduire tables référentiels + workflow_definition  
4) Adapter `DossierStatusTransitionService` pour valider via le workflow en base  
5) Ajouter UI Admin (MVP) : gestion statuts/types/transitions par org
