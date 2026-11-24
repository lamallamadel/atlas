# Règles métier (politiques transverses)

> **Statut**: En partie implémenté (AS-IS) + politiques market-ready (TO-BE)  
> **Dernière vérification**: 2026-11-23 (§2 réécrit)  
> **Source of truth**: Oui (pour les règles transverses)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`  
- `docs/atlas-immobilier/03_technique/05_audit_logging_design.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

Ce document centralise les règles applicables **à tous les métiers** (vente, location, mandat, projet) afin d’éviter des divergences.

## 1) Workflow dossier (statuts, transitions)

### AS-IS
- Transitions validées côté backend
- Historique des changements de statut (status_history)

### TO-BE (multi-métiers)
- Les statuts/types deviennent des **référentiels tenant-scopés** + workflow configurable par `caseType`.  
  Référence : `03_referentiels_workflows_modulables.md`

### Politiques obligatoires
- `CRM_CLOSED_WON` et `CRM_CLOSED_LOST` sont terminaux (override admin possible)
- Passage vers `CRM_CLOSED_LOST` impose `LOSS_REASON`
- Passage vers `CRM_CLOSED_WON` impose `WON_REASON`

## 2) Consentement & communications (AS-IS, 2026-11)

> Réécrit le 2026-11-23 pour refléter le code (`OutboundMessageService`, `DossierWhatsAppService`, `ConsentRequestService`). La règle précédente (« GRANTED requis pour tout envoi ») bloquait la réponse à un client qui écrit en premier, et l’envoi du lien de consentement lui-même.

### Principe
Le consentement est enregistré **par dossier, par canal et par type** (`MARKETING`, `TRANSACTIONNEL`, …). Statuts : `GRANTED`, `DENIED`, `PENDING`, `REVOKED`, `EXPIRED`. Tout refus d’envoi produit une erreur 422 et un audit `BLOCKED_BY_POLICY`.

### Trois situations

| Situation | Exemple | Règle |
|---|---|---|
| Prospection | Pitch d’un bien, relance commerciale, campagne | `MARKETING` **GRANTED** avec preuve d’opt-in double : `doubleOptInConfirmed=true`, `optInTimestamp`, `ipAddress`. Seul le client peut la donner, via le lien de consentement |
| Suivi du dossier | Rappel de RDV, information sur le dossier en cours | `TRANSACTIONNEL` **GRANTED** sur le canal. L’agent peut l’enregistrer lui-même ; la preuve porte `source=AGENT` (`ConsentementService.stampAgentProof`) |
| Réponse au client | Le client a écrit sur WhatsApp il y a moins de 24 h | Aucun accord préalable requis. Refus seulement si `TRANSACTIONNEL` est `DENIED` ou `REVOKED`. Hors fenêtre de 24 h : 409, il faut un template approuvé par Meta |

### Lien de consentement
- L’agent génère un lien (`POST /api/v1/dossiers/{id}/consent-links`), valable quelques jours, et l’envoie au client, en général comme réponse WhatsApp dans la fenêtre de 24 h.
- Le client accepte ou refuse sur une page publique (`/consentement/{token}`). L’acceptation crée le consentement `MARKETING` avec la preuve d’opt-in double (IP, horodatage, user-agent).

### Politique Meta (rappel)
- Un message du client **n’est pas** un opt-in pour des messages proactifs ultérieurs.
- L’opt-in peut être demandé dans la conversation WhatsApp.
- Décisions produit encore ouvertes : autoriser un pitch dans la fenêtre de 24 h d’un message client ; accepter un « OUI » dans la conversation comme opt-in.

## 3) Messages (journalisation + traçabilité)

- Tout message est rattaché à un dossier (case).
- Tout OUTBOUND :
  - respecte les règles de consentement du §2
  - crée un audit event + activity `MESSAGE_LOG`
- Inbound WhatsApp :
  - association dossier (téléphone) + idempotence

## 4) Rendez-vous (RDV)

- Un RDV est rattaché à un dossier.
- Création/modification RDV :
  - crée un audit event
  - crée une activity `APPOINTMENT_LOG`
- Chevauchement : warning minimum, blocage optionnel selon org.

## 5) Multi-tenancy (isolement)

- Toute donnée est scoped par organisation.
- Aucun endpoint ne doit permettre une fuite inter-tenant.
- Le header `X-Org-Id` (ou mécanisme équivalent) est obligatoire et validé côté backend.

Référence : `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`

## 6) Audit & historique

Politiques :
- Toutes les opérations core (dossier, statut, message, rdv, consentement) génèrent un audit event.
- Les changements de statut génèrent status_history + activity `STATUS_CHANGE`.

## 7) Coop Habitat (TO-BE) — règles de gouvernance & cotisation

> **Périmètre** : module “Coop Habitat” (groupement).  
> **Source of truth** : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.

### 7.1 FIFO d’allocation (et non FIFO de livraison)
- Le rang FIFO détermine la **priorité d’attribution** d’un lot.
- La livraison dépend des jalons du projet (`COOP_PROJECT`) ; un lot peut être “attribué” avant d’être livrable.

### 7.2 Éligibilité à l’allocation (cut-off)
- Un membre est éligible à l’allocation si :
  - `member_status=ACTIVE`,
  - contributions à jour à la date de cut-off (ex: toutes les échéances <= cut-off confirmées),
  - absence de blocage (litige / suspension), si activé par la gouvernance.

### 7.3 Cotisation croissante (indexation) — règle de transparence
- Toute formule d’indexation doit être :
  - lisible (table d’échéances + explication),
  - versionnée (changement de formule = nouvelle version + notification),
  - tracée (audit + PV si décision collective).

### 7.4 Preuve & audit (obligatoire)
- Toute décision critique doit être justifiée par un document (PV/contrat) attaché et auditée :
  - ouverture/fermeture de collecte,
  - validation d’une allocation,
  - exclusion/remplacement d’un membre,
  - modification des règles financières.

### 7.5 Notifications obligatoires (Choix B)
- Appels de fonds, rappels, allocations et jalons projet déclenchent des notifications outbound (WhatsApp) via Outbox (voir `03_technique/09_notifications.md`).

## 8) Propriétaire et mandat (cas d'usage n°1, TO-BE)

Règles détaillées et numérotées (R-PROP-01 à R-PROP-16) : `02_fonctionnel/13_uc_proprietaire_mandats.md` § 6. Principes transverses :
- **Coordonnées du propriétaire** : jamais publiques ; transmises à une agence seulement quand il accepte sa proposition, avec un code à usage unique (preuve tracée).
- **Délégation sans publication** : un propriétaire peut confier son bien à un agent sans jamais le publier ; le bien reste privé jusqu'à l'annonce de l'agence mandatée.
- **Un bien, plusieurs annonces** : toute annonce d'un bien déclaré par un propriétaire porte son `property_id` ; le portail affiche une seule fiche par bien et le contrôle doublon ignore les annonces d'un même bien.
- **Exclusivité** : un mandat exclusif actif suspend l'annonce du propriétaire et interdit toute autre demande ou mandat sur le bien.
- **Isolation** : les objets qui relient propriétaire et agence (demande, proposition, mandat, messagerie) ne se lisent qu'à travers un service d'accès qui vérifie l'appartenance à l'une des deux organisations (ADR 0005).
- **Modération** : la première annonce d'un propriétaire est validée par la plateforme avant d'être visible.

