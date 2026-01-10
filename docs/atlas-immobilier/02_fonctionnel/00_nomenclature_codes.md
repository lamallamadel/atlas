# Nomenclature des codes (référentiels & workflows)

> **Statut**: TO-BE (contrat stable)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Oui (nomenclature des codes stockés en base)  
> **Objectif**: garantir la cohérence des référentiels (`*_code`) et des transitions (workflows), sans enums “hardcodés”.

## 1) Portée

Cette nomenclature s’applique à tous les champs de type **code** persistés (ex: `case_type_code`, `status_code`, `reason_code`, `media_type_code`, etc.).

- Les codes sont **stables** et versionnés (changement = migration de données).
- Les libellés (FR/AR/EN) sont **descriptions** et traduisibles, sans impact sur la logique.
- Les transitions autorisées sont décrites dans:
  - `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`
  - `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`

## 2) Conventions globales

- Format: `MAJUSCULES` + `_` (underscore), pas d’espace.
- Pas d’accents, pas de tirets.
- Un code ne doit **jamais** changer de sens.
- Les préfixes reflètent le **domaine** (annonce, transaction, crm, coop, modération, etc.).
- Les listes ci-dessous sont la **vérité** pour les codes attendus (MVP + extensions).

## 3) `dict_type` (types de référentiels)

Le système de référentiels en base utilise `dict_type` pour regrouper des codes dans un même dictionnaire.

Valeurs autorisées (contrat):

  - `CASE_TYPE`, `CASE_STATUS`, `ANN_STATUS`, `TX_TYPE`
  - `APPOINT_TYPE`, `APPOINT_STATUS`, `APPT_CONFIRM_STATUS`, `MOD_STATUS`
  - `REPORT_REASON`, `REPORT_STATUS`, `CONSENT_TYPE`, `CONSENT_SOURCE`
  - `MEDIA_TYPE`, `DOC_TYPE`, `PAY_METHOD`, `ACTIVITY_TYPE`
  - `CHANNEL_TYPE`

> Note: `ACTIVITY_TYPE` et `CHANNEL_TYPE` sont introduits dès maintenant pour cadrer l’évolution “messages & activités”.

---

# 4) Annonces (Listings)

## 4.1 `TX_TYPE` (type de transaction)
  - `TX_SALE`, `TX_RENT`

- `TX_SALE`: vente
- `TX_RENT`: location longue durée (par défaut).  
  Extension possible (V1.5) via nouveau code (ex: `TX_SHORT_STAY`) si besoin.

## 4.2 `ANN_STATUS` (statut annonce)
  - `ANN_DRAFT`, `ANN_PUBLISHED`, `ANN_SUSPENDED`, `ANN_ARCHIVED`

- `ANN_DRAFT`: brouillon (non visible public)
- `ANN_PUBLISHED`: publié (visible public)
- `ANN_SUSPENDED`: suspendu (modération / fraude / litige)
- `ANN_ARCHIVED`: archivé (fin de vie, non public)

## 4.3 `MEDIA_TYPE` (médias annonce)
  - `MEDIA_DELETE`, `MEDIA_IMAGE`, `MEDIA_UPLOAD`

- `MEDIA_IMAGE`: image (MVP)
- Extensions possibles: `MEDIA_FLOORPLAN`, `MEDIA_VIDEO`, `MEDIA_DOC` (si ajout futur)

---

# 5) Dossier (CRM / Case)

## 5.1 `CASE_TYPE` (type de dossier)

> Un dossier (“case”) représente un processus dans le temps (lead, mandat, transaction, coop, etc.).  
> Les workflows sont **chargés par caseType**.

Codes standard (contrat):

  - `COOP_ALLOCATION`, `COOP_ALLOCATION_CASE`, `COOP_GROUP`
  - `COOP_MEMBER`, `COOP_PROJECT`, `CRM_LEAD`
  - `CRM_LEAD_BUY`, `CRM_LEAD_RENT`, `CRM_MANDATE`
  - `CRM_PROPERTY_LISTING`, `CRM_RENTAL_TRANSACTION`, `CRM_SALE_TRANSACTION`

Notes:
- `CRM_LEAD`, `CRM_LEAD_BUY`, `CRM_LEAD_RENT`: lead immobilier (générique / achat / location)
- `CRM_MANDATE`: mandat (si géré)
- `CRM_PROPERTY_LISTING`: mise en vente/location d’un bien par l’agence (si distinct)
- `CRM_SALE_TRANSACTION` / `CRM_RENTAL_TRANSACTION`: transaction structurée (phase post-lead)
- `COOP_*`: domaine Coop Habitat (module)

## 5.2 `CASE_STATUS` (statuts CRM)

### 5.2.1 Pipeline “MVP” (statuts cœur)
  - `CRM_NEW`, `CRM_CONTACTED`, `CRM_SCREENING`, `CRM_QUALIFIED`
  - `CRM_VISIT_PLANNED`, `CRM_VISIT_DONE`, `CRM_OFFER_RECEIVED`, `CRM_NEGOTIATION`
  - `CRM_SIGNING_SCHEDULED`, `CRM_DELIVERY`, `CRM_CLOSED_WON`, `CRM_CLOSED_LOST`
  - `CRM_ON_HOLD`, `CRM_REJECTED`, `CRM_ARCHIVED`

- Terminaux par défaut:
  - `CRM_CLOSED_WON`
  - `CRM_CLOSED_LOST`

### 5.2.2 Statuts étendus (richesse doc existante)
Ces statuts existent dans la documentation et restent valides. Leur usage exact dépend du workflow associé au `case_type_code`.

  - `CRM_APPROVED`, `CRM_ARCHIVED`, `CRM_BUILDING`, `CRM_CLOSED_LOST`
  - `CRM_CLOSED_WON`, `CRM_COMPROMISE_SIGNED`, `CRM_CONTACTED`, `CRM_CONTRACTING`
  - `CRM_COUNTER_OFFER`, `CRM_DELIVERY`, `CRM_DESIGN`, `CRM_DISQUALIFIED`
  - `CRM_DOCS_RECEIVED`, `CRM_DOCS_REQUESTED`, `CRM_FEASIBILITY`, `CRM_FINANCING`
  - `CRM_FOLLOW_UP`, `CRM_IDEA`, `CRM_INVESTOR_CASE`, `CRM_LISTED`
  - `CRM_LOSS_NO_RESPONSE`, `CRM_MANDATE`, `CRM_MANDATE_PENDING`, `CRM_MANDATE_RENT`
  - `CRM_MANDATE_SALE`, `CRM_MANDATE_SIGNED`, `CRM_NEGOTIATION`, `CRM_NEW`
  - `CRM_NO_SHOW`, `CRM_OFFER_RECEIVED`, `CRM_OFFER_REQUESTED`, `CRM_ON_HOLD`
  - `CRM_OWNER_LEAD`, `CRM_PAUSED`, `CRM_PERMITS`, `CRM_PROJECT_CONSTRUCTION`
  - `CRM_PROJECT_RENOVATION`, `CRM_PROPERTY_LISTING`, `CRM_QUALIFIED`, `CRM_REASSIGNED`
  - `CRM_REJECTED`, `CRM_RENTAL_TRANSACTION`, `CRM_SALE_TRANSACTION`, `CRM_SCREENING`
  - `CRM_SIGNING_IN_PROGRESS`, `CRM_SIGNING_SCHEDULED`, `CRM_SUPPORT_DISPUTE`, `CRM_TRIAGED`
  - `CRM_UNREACHABLE`, `CRM_VALUATION_DONE`, `CRM_VISIT_DONE`, `CRM_VISIT_PLANNED`
  - `CRM_WON_SIGNED`

## 5.3 `ACTIVITY_TYPE` (timeline / activités)
  - `ACT_APPOINTMENT_LOG`, `ACT_DOCUMENT_LOG`, `ACT_MESSAGE_LOG`, `ACT_NOTE`
  - `ACT_STATUS_CHANGE`, `ACT_SYSTEM`, `ACT_TASK`

- `ACT_STATUS_CHANGE` correspond à l’action “changement de statut” (auditée)
- `ACT_MESSAGE_LOG` journalise une interaction (WhatsApp click / appel / email) — MVP via tracking
- `ACT_SYSTEM` est réservé aux événements automatiques (ex: déduplication, SLA breach)

## 5.4 `CHANNEL_TYPE` (canal)
  - `CHAN_WHATSAPP`, `CHAN_SMS`, `CHAN_EMAIL`, `CHAN_PHONE`


# 5.5 `LEAD_SOURCE` (provenance)

  - `LEAD_SOURCE_WHATSAPP`, `LEAD_SOURCE_FORM`, `LEAD_SOURCE_PHONE`
  - `LEAD_SOURCE_AVITO`, `LEAD_SOURCE_MUBAWAB`, `LEAD_SOURCE_OTHER`

---

# 6) RDV / Visites

## 6.1 `APPOINT_TYPE`
  - `APPOINT_VISIT`, `APPOINT_CALL`

## 6.2 `APPOINT_STATUS`
  - `APPOINT_SCHEDULED`, `APPOINT_DONE`, `APPOINT_NO_SHOW`, `APPOINT_CANCELLED`

## 6.3 `APPT_CONFIRM_STATUS` (option avancée)
  - `APPT_PENDING`, `APPT_CONFIRMED`, `APPT_REJECTED`, `APPT_LATE`
  - `APPT_WAIVED`

> `APPT_*` est utilisé pour un sous-processus de confirmation / réponse / présence (utile V1+).

---

# 7) Modération & signalements

## 7.1 `MOD_STATUS` (statut modération)
  - `MOD_APPROVED`, `MOD_DECIDED`, `MOD_PENDING`, `MOD_REJECTED`
  - `MOD_SUSPENDED`

- `MOD_PENDING`: en attente
- `MOD_APPROVED`: approuvé
- `MOD_REJECTED`: rejeté
- `MOD_SUSPENDED`: suspendu

## 7.2 `REPORT_REASON` (raison signalement)
  - `REPORT_DUPLICATE`, `REPORT_FRAUD`, `REPORT_OTHER`, `REPORT_WRONG_INFO`

## 7.3 `REPORT_STATUS` (cycle de vie signalement)
  - `REPORT_OPEN`, `REPORT_IN_REVIEW`, `REPORT_CLOSED`

---

# 8) Consentements

## 8.1 `CONSENT_TYPE`
  - `CONSENT_CONTACT`, `CONSENT_MARKETING`

## 8.2 `CONSENT_SOURCE`
  - `CONSENT_SRC_FORM`, `CONSENT_SRC_IMPORT`, `CONSENT_SRC_API`

---

# 9) Documents & paiements (extensions encadrées)

## 9.1 `DOC_TYPE` (document log / preuves)
  - `DOC_PV`, `DOC_CONTRACT`, `DOC_PAYMENT_PROOF`
  - `DOC_IDENTITY`, `DOC_OTHER`

## 9.2 `PAY_METHOD` (moyen de paiement — Coop / gestion)
  - `PAY_METHOD_BANK_TRANSFER`, `PAY_METHOD_CASH`, `PAY_METHOD_CARD`
  - `PAY_METHOD_CHECK`, `PAY_METHOD_OTHER`

---

# 10) Coop Habitat — codes (module)

## 10.1 Entités (`entity_type`)
- `COOP_GROUP`
- `COOP_PROJECT`
- `COOP_MEMBER`
- `COOP_ALLOCATION` / `COOP_ALLOCATION_CASE`

## 10.2 Statuts — Groupes
  - `COOP_GROUP_ALLOCATION_RUNNING`, `COOP_GROUP_CANCELLED`, `COOP_GROUP_COMPLETED`
  - `COOP_GROUP_FORMATION`, `COOP_GROUP_FUNDING_CLOSED`, `COOP_GROUP_FUNDING_OPEN`
  - `COOP_GROUP_KYC_READY`, `COOP_GROUP_THRESHOLD_REACHED`

## 10.3 Statuts — Projets
  - `COOP_PROJECT_BUILDING`, `COOP_PROJECT_CANCELLED`, `COOP_PROJECT_CLOSED`
  - `COOP_PROJECT_CONTRACTING`, `COOP_PROJECT_DELIVERY`, `COOP_PROJECT_HANDOVER`
  - `COOP_PROJECT_LAND_SECURED`, `COOP_PROJECT_MILESTONE_REACHED`, `COOP_PROJECT_PERMITS`

## 10.4 Statuts — Membres
  - `COOP_MEMBER_ACTIVE`, `COOP_MEMBER_CASE`, `COOP_MEMBER_DEFAULT_PAYMENT`
  - `COOP_MEMBER_EXCLUDED`, `COOP_MEMBER_EXITED`, `COOP_MEMBER_IN_DEFAULT`
  - `COOP_MEMBER_PENDING_KYC`, `COOP_MEMBER_SUSPENDED`

## 10.5 Statuts — Allocation
  - `COOP_ALLOCATION_ASSIGNED`, `COOP_ALLOCATION_CASE`, `COOP_ALLOC_APPROVED`
  - `COOP_ALLOC_ASSIGNED`, `COOP_ALLOC_CANCELLED`, `COOP_ALLOC_ELIGIBILITY_CHECK`
  - `COOP_ALLOC_PROPOSED`, `COOP_ALLOC_SIGNED`

## 10.6 Événements / sous-types utiles (non exhaustif)
- `COOP_CALL_FOR_FUNDS_SENT`
- `COOP_PAYMENT_DECLARED`
- `COOP_PAYMENT_VERIFIED`
- `COOP_PROJECT_MILESTONE_REACHED`
- `COOP_DEFAULT_FOLLOWUP`

---

# 11) Feature keys (modules activables)

Les clés de feature flags suivent la convention:
- `core.*` (socle)
- `module.*` (modules)
- `addon.*` (options monétisées)

Exemples:
- `module.trust.basic`
- `module.trust.kyc`
- `module.developers`
- `module.financing`
- `module.rentals`
- `module.invest`
- `module.neighborhoods`
- `module.pm`
- `module.concierge`
- `module.cobuy`

---

# 12) Règles de validation associées (rappel)

1) Un workflow `COOP_*` ne référence que des statuts `COOP_*`.  
2) Les terminaux CRM par défaut: `CRM_CLOSED_WON`, `CRM_CLOSED_LOST`.  
3) Les actions sensibles (publication annonce, réassignation lead, décision modération, exports) génèrent un `AuditEvent`.  
4) Tout code introduit doit être ajouté ici + référencé dans les dictionnaires et workflows.
