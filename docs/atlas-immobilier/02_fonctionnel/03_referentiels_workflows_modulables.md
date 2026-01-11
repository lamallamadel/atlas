# Référentiels & Workflows modulables (multi-métiers immobilier)

> **Statut**: TO-BE (cible MVP market-ready)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour la taxonomie et les templates de workflows)  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`  
- `docs/atlas-immobilier/03_technique/02_modele_donnees_advanced.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Objectif

Permettre à Atlas Immobilier d’être **modulable par métier** (vente, location, mandat, construction, etc.) en évitant de figer les enums métier dans le code.

Le principe : les “enums métier” deviennent des **référentiels tenant-scopés** en base + un **workflow configurable** par type de dossier.

## AS-IS (aujourd’hui)

- Le dossier possède un statut géré par une logique de transitions côté backend.
- Le set des statuts est essentiellement **codé** (enum/validation).
- L’UI présente les statuts et transitions selon l’implémentation.

## TO-BE (cible)

### 1) Dossier = Case universel
Un dossier (case) représente une affaire/processus dans le temps : lead, mandat, transaction (vente/location), et éventuellement projets (promoteur) ou coop habitat.

Champs structurants :
- `caseType` : type métier (ex: `CRM_LEAD_BUY`, `CRM_LEAD_RENT`, `CRM_MANDATE`, `CRM_SALE_TRANSACTION`, `CRM_RENTAL_TRANSACTION`, `COOP_GROUP`).
- `statusCode` : statut courant (appartenant au workflow du type)
- `lossReason` / `wonReason` : requis à la clôture
- `source` : provenance du lead/case (ex: `LEAD_SOURCE_WHATSAPP`, `LEAD_SOURCE_FORM` (MVP). Extensions possibles: `LEAD_SOURCE_PHONE`, `LEAD_SOURCE_AVITO`, `LEAD_SOURCE_MUBAWAB`.).

### 2) Référentiels (dictionnaires)
Tous les éléments métier configurables sont en data (et tenant-scopés) :
- Types de dossiers (CASE_TYPE)
- Statuts (CASE_STATUS)
- Raisons perte/gain (LOSS_REASON / WON_REASONN)
- Sources (LEAD_SOURCE)
- Types RDV (`APPOINT_VISIT`, `APPOINT_CALL`), statuts RDV (`APPOINT_SCHEDULED`, `APPOINT_DONE`, `APPOINT_NO_SHOW`, `APPOINT_CANCELLED`), types d’activités (`ACT_*`) et canaux (`CHAN_*`).

### 3) Workflows
Un workflow est défini par :
- États autorisés (subset du pool CASE_STATUS)
- Transitions autorisées (from → to)
- Règles (terminalité, justification, rôles, pré-conditions)

L’UI n’affiche **que** les transitions atteignables depuis l’état courant.

---

# Référentiels — socle (codes stables)

## A) CASE_TYPE (types de dossiers)
- `CRM_LEAD_BUY` — Prospect Achat  
- `CRM_LEAD_RENT` — Prospect Location  
- `CRM_OWNER_LEAD` — Prospect Propriétaire (vendre/louer)  
- `CRM_SALE_TRANSACTION` — Transaction Vente  
- `CRM_RENTAL_TRANSACTION` — Transaction Location  
- `CRM_MANDATE_SALE` — Mandat Vente  
- `CRM_MANDATE_RENT` — Mandat Location / Gestion  
- `CRM_PROPERTY_LISTING` — Fiche Bien / Listing (interne)  
- `CRM_PROJECT_CONSTRUCTION` — Projet Construction  
- `CRM_PROJECT_RENOVATION` — Projet Rénovation  
- `CRM_INVESTOR_CASE` — Dossier Investisseur  
- `CRM_SUPPORT_DISPUTE` — Litige / SAV  

## B) CASE_STATUS (pool de statuts)
### Entrée / tri / contact
`CRM_NEW`, `CRM_TRIAGED`, `CRM_CONTACTED`, `CRM_UNREACHABLE`, `CRM_QUALIFIED`, `CRM_DISQUALIFIED`, `CRM_ON_HOLD`, `CRM_REASSIGNED`

### Visite / relance
`CRM_VISIT_PLANNED`, `CRM_VISIT_DONE`, `CRM_NO_SHOW`, `CRM_FOLLOW_UP`

### Offre / négociation
`CRM_OFFER_REQUESTED`, `CRM_OFFER_RECEIVED`, `CRM_NEGOTIATION`, `CRM_COUNTER_OFFER`

### Conformité (location)
`CRM_DOCS_REQUESTED`, `CRM_DOCS_RECEIVED`, `CRM_SCREENING`, `CRM_APPROVED`, `CRM_REJECTED`

### Signature / clôture
`CRM_SIGNING_SCHEDULED`, `CRM_SIGNING_IN_PROGRESS`, `CRM_CLOSED_WON`, `CRM_CLOSED_LOST`

### Listing / mandat
`CRM_MANDATE_PENDING`, `CRM_MANDATE_SIGNED`, `CRM_VALUATION_DONE`, `CRM_LISTED`, `CRM_PAUSED`, `CRM_ARCHIVED`

### Projet
`CRM_IDEA`, `CRM_FEASIBILITY`, `CRM_DESIGN`, `CRM_PERMITS`, `CRM_CONTRACTING`, `CRM_BUILDING`, `CRM_DELIVERY`

### Vente (optionnels, utiles)
`CRM_COMPROMISE_SIGNED`, `CRM_FINANCING`

## C) LOSS_REASON / WON_REASON
**LOSS_REASON** : `PRICE_TOO_HIGH`, `NOT_INTERESTED`, `COMPETITOR`, `NO_RESPONSE`, `FINANCING_ISSUE`, `DOCS_INCOMPLETE`,
`OWNER_CHANGED_MIND`, `PROPERTY_UNAVAILABLE`, `REQUIREMENTS_MISMATCH`, `TIMELINE_TOO_LONG`, `FRAUD_RISK`, `OTHER`

**WON_REASON** : `SIGNED`, `RESERVED`, `DEPOSIT_PAID`, `SOLD`, `RENTED`, `PROJECT_DELIVERED`, `OTHER`

## D) LEAD_SOURCE (sources)
`WHATSAPP`, `PHONE_CALL`, `SMS`, `EMAIL`, `FACEBOOK`, `INSTAGRAM`, `AVITO`, `MUBAWAB`, `WEBSITE`, `WALK_IN`, `REFERRAL`, `PARTNER`, `OTHER`

## E) RDV / activités
**APPOINTMENT_TYPE** : `PHONE_CALL`, `OFFICE_MEETING`, `PROPERTY_VISIT`, `OWNER_VISIT`, `NOTARY_MEETING`, `SIGNING`, `SITE_VISIT`, `VIDEO_CALL`  
**APPOINTMENT_OUTCOME** : `DONE`, `COOP_GROUP_CANCELLED`, `RESCHEDULED`, `CRM_NO_SHOW`, `PARTIAL`, `OTHER`  

**ACTIVITY_TYPE** : `NOTE`, `TASK`, `STATUS_CHANGE`, `MESSAGE_LOG`, `APPOINTMENT_LOG`, `DOCUMENT_LOG`, `SYSTEM`  
**TASK_CATEGORY** : `CALL_BACK`, `SEND_MESSAGE`, `REQUEST_DOCS`, `REVIEW_DOCS`, `PREPARE_VISIT`, `FOLLOW_UP_VISIT`, `NEGOTIATE`, `SCHEDULE_SIGNING`, `OTHER`

---


### Coop Habitat

**Statuts Group (gouvernance / collecte)** :  
`COOP_GROUP_FORMATION`, `COOP_GROUP_KYC_READY`, `COOP_GROUP_FUNDING_OPEN`, `COOP_GROUP_THRESHOLD_REACHED`, `COOP_GROUP_FUNDING_CLOSED`, `COOP_GROUP_ALLOCATION_RUNNING`, `COOP_GROUP_COMPLETED`, `COOP_GROUP_CANCELLED`

**Statuts Project (immobilier)** :  
`COOP_PROJECT_LAND_SECURED`, `COOP_PROJECT_PERMITS`, `COOP_PROJECT_CONTRACTING`, `COOP_PROJECT_BUILDING`, `COOP_PROJECT_DELIVERY`, `COOP_PROJECT_HANDOVER`, `COOP_PROJECT_CLOSED`, `COOP_PROJECT_CANCELLED`

**Statuts Allocation (attribution lots)** :  
`COOP_ALLOC_PROPOSED`, `COOP_ALLOC_ELIGIBILITY_CHECK`, `COOP_ALLOC_APPROVED`, `COOP_ALLOC_ASSIGNED`, `COOP_ALLOC_SIGNED`, `COOP_ALLOC_CANCELLED`

**Statuts Member (membres)** :  
`COOP_MEMBER_PENDING_KYC`, `COOP_MEMBER_ACTIVE`, `COOP_MEMBER_SUSPENDED`, `COOP_MEMBER_IN_DEFAULT`, `COOP_MEMBER_EXITED`, `COOP_MEMBER_EXCLUDED`

> Remarque : ces statuts sont volontairement séparés (préfixes) afin d’éviter toute collision avec le CRM. Voir `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`.

# Templates de workflows (par CASE_TYPE)

## 1) CRM_LEAD_RENT (Prospect Location)
Chemin nominal :  
`CRM_NEW → CRM_TRIAGED → CRM_CONTACTED → CRM_QUALIFIED → CRM_VISIT_PLANNED → CRM_VISIT_DONE → CRM_DOCS_REQUESTED → CRM_DOCS_RECEIVED → CRM_SCREENING → CRM_APPROVED → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`

Branches :
- `CRM_CONTACTED → CRM_UNREACHABLE → CRM_CONTACTED`
- `CRM_VISIT_PLANNED → CRM_NO_SHOW → CRM_FOLLOW_UP → CRM_VISIT_PLANNED`
- `CRM_SCREENING → CRM_REJECTED → CRM_CLOSED_LOST`
- `CRM_QUALIFIED → CRM_ON_HOLD → CRM_QUALIFIED`

## 2) CRM_LEAD_BUY (Prospect Achat)
Chemin nominal :  
`CRM_NEW → CRM_CONTACTED → CRM_QUALIFIED → CRM_VISIT_PLANNED → CRM_VISIT_DONE → CRM_OFFER_REQUESTED → CRM_OFFER_RECEIVED → CRM_NEGOTIATION → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`  
Branches : `CRM_NEGOTIATION ↔ CRM_COUNTER_OFFER`, `CRM_QUALIFIED → CRM_ON_HOLD → CRM_QUALIFIED`

## 3) CRM_OWNER_LEAD (Prospect Propriétaire)
`CRM_NEW → CRM_CONTACTED → CRM_QUALIFIED → CRM_VALUATION_DONE → CRM_MANDATE_PENDING → CRM_MANDATE_SIGNED → CRM_LISTED`  
Branches : `CRM_LISTED ↔ CRM_PAUSED`, `CRM_LISTED → CRM_ARCHIVED`, `CRM_MANDATE_PENDING → CRM_CLOSED_LOST`

## 4) CRM_SALE_TRANSACTION (Transaction Vente)
`CRM_NEW → CRM_MANDATE_SIGNED → CRM_LISTED → CRM_VISIT_PLANNED → CRM_VISIT_DONE → CRM_OFFER_RECEIVED → CRM_NEGOTIATION → CRM_COMPROMISE_SIGNED → CRM_FINANCING → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`  
Branches : `CRM_NEGOTIATION ↔ CRM_COUNTER_OFFER`, `CRM_FINANCING → CRM_ON_HOLD → CRM_FINANCING`, `CRM_OFFER_RECEIVED → CRM_CLOSED_LOST` (avec raison)

`CRM_NEW → CRM_QUALIFIED → CRM_VISIT_DONE → CRM_DOCS_REQUESTED → CRM_DOCS_RECEIVED → CRM_SCREENING → CRM_APPROVED → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`  
`CRM_NEW → CRM_QUALIFIED → CRM_VISIT_DONE → CRM_DOCS_REQUESTED → CRM_DOCS_RECEIVED → CRM_SCREENING → CRM_APPROVED → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`  
Branche : `CRM_SCREENING → CRM_REJECTED → CRM_CLOSED_LOST`

`CRM_VALUATION_DONE → CRM_MANDATE_PENDING → CRM_MANDATE_SIGNED → CRM_LISTED → (CRM_PAUSED ↔ CRM_LISTED) → CRM_ARCHIVED`
`CRM_VALUATION_DONE → CRM_MANDATE_PENDING → CRM_MANDATE_SIGNED → CRM_LISTED → (CRM_PAUSED ↔ CRM_LISTED) → CRM_ARCHIVED`

## 7) CRM_PROJECT_CONSTRUCTION
`CRM_IDEA → CRM_FEASIBILITY → CRM_DESIGN → CRM_PERMITS → CRM_CONTRACTING → CRM_BUILDING → CRM_DELIVERY → CRM_CLOSED_WON`  
Branches : `CRM_ON_HOLD`, `CRM_CLOSED_LOST`

## 8) CRM_PROJECT_RENOVATION
`CRM_IDEA → CRM_FEASIBILITY → CRM_DESIGN → CRM_CONTRACTING → CRM_BUILDING → CRM_DELIVERY → CRM_CLOSED_WON`

## 9) CRM_INVESTOR_CASE
`CRM_NEW → CRM_CONTACTED → CRM_QUALIFIED → CRM_OFFER_RECEIVED → CRM_NEGOTIATION → CRM_SIGNING_SCHEDULED → CRM_CLOSED_WON`

## 10) CRM_SUPPORT_DISPUTE
`CRM_NEW → CRM_TRIAGED → CRM_CONTACTED → CRM_QUALIFIED → CRM_FOLLOW_UP → CRM_CLOSED_WON / CRM_CLOSED_LOST`

---

# Politiques transverses (obligatoires)

1) `CRM_CLOSED_LOST` exige `LOSS_REASON`  
2) `CRM_CLOSED_WON` exige `WON_REASON`  
3) Outbound (`DIRECTION=OUTBOUND`) via `WHATSAPP/SMS/EMAIL` exige consentement `GRANTED`  
4) Toute transition statut crée automatiquement :
- status history
- audit event
- activity `STATUS_CHANGE`

---

# Migration (du AS-IS vers TO-BE)

Approche recommandée :
1) Introduire `caseType` (valeur par défaut `CRM_LEAD_BUY`/`CRM_LEAD_RENT` selon usage)  
2) Remplacer l’enum `DossierStatus` par `statusCode` (string) tout en gardant la compatibilité  
3) Introduire tables référentiels + workflow_definition  
4) Adapter `DossierStatusTransitionService` pour valider via le workflow en base  
5) Ajouter UI Admin (MVP) : gestion statuts/types/transitions par org

---

## Extension “Coop Habitat” (module groupement)

> Cette extension ajoute un domaine “habitat participatif/coopérative” **sans enlever** les métiers existants.  
> Elle réutilise le même mécanisme : `caseType` + `statusCode` + workflow par type.

### CASE_TYPE — ajouts (TO-BE)
- `COOP_GROUP` — Groupement / Coop (gouvernance + collecte)
- `COOP_PROJECT` — Projet de construction (jalons)
- `COOP_MEMBER_CASE` — Dossier membre (optionnel si tu veux un “case” par membre)
- `COOP_ALLOCATION` — Allocation de lot (process d’attribution)

### CASE_STATUS — ajouts (pool global)
#### Group (COOP_GROUP)
- `COOP_GROUP_FORMATION`
- `COOP_GROUP_KYC_READY`
- `COOP_GROUP_FUNDING_OPEN`
- `COOP_GROUP_THRESHOLD_REACHED`
- `COOP_GROUP_FUNDING_CLOSED`
- `COOP_GROUP_ALLOCATION_RUNNING`
- `COOP_GROUP_COMPLETED`
- `COOP_GROUP_CANCELLED`

#### Project (COOP_PROJECT)
- `COOP_PROJECT_LAND_SECURED`
- `COOP_PROJECT_HANDOVER`
- `COOP_PROJECT_CLOSED`

> Les statuts `CRM_PERMITS`, `CRM_CONTRACTING`, `CRM_BUILDING`, `CRM_DELIVERY`, `CRM_ON_HOLD` sont déjà présents dans le pool “Projet”.

#### Allocation (COOP_ALLOCATION)
- `PROPOSED`
- `VALIDATED`
- `ASSIGNED`
- `CRM_REJECTED`
- `COOP_PROJECT_CLOSED`

### Référentiels spécifiques (recommandés)
#### MEMBER_STATUS
- `PENDING_KYC`, `ACTIVE`, `SUSPENDED`, `EXITED`, `EXCLUDED`

#### CONTRIBUTION_STATUS
- `PENDING`, `CONFIRMED`, `CRM_REJECTED`, `LATE`, `WAIVED`

#### CONTRIBUTION_METHOD
- `BANK_TRANSFER`, `CASH`, `CHECK`, `OTHER`

### Templates de workflows (TO-BE)
Les templates détaillés sont décrits dans :
- `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`

## Workflow spécifique — B2B Demo (biz → pro)

- Machine à états dédiée : `docs/atlas-immobilier/02_fonctionnel/08_workflow_b2b_demo.md`
- UI Pro associée : `docs/atlas-immobilier/02_fonctionnel/09_ui_pro_crm_b2b_demo.md`
- Règle clé : l’UI consomme `allowedTransitions` (pas de logique hardcodée)
