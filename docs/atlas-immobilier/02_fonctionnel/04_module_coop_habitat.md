# Module “Coop Habitat” (groupement d’habitat participatif) — MVP v1

> **Statut**: TO-BE (extension MVP v1 — non implémentée)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour le concept Coop Habitat)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/02_regles_metier.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/02_modele_donnees_advanced.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Objectif

Ajouter à Atlas Immobilier un module “**coopérative d’habitat**” (ou groupement) permettant de gérer un projet immobilier collectif :

- gouvernance (membres, rôles, décisions/PV, transparence),
- gestion des cotisations (plan, échéances, pénalités),
- allocation des lots (FIFO d’allocation, pas FIFO de livraison),
- suivi projet (jalons terrain → permis → chantier → livraison),
- traçabilité (audit + timeline) et communication WhatsApp (Choix B).

Ce module vise **la robustesse opérationnelle** (confiance, preuves, règles) avant l’intégration de paiement (fintech) : la V1 est **déclarative** (justificatifs), marketable comme “outil de gestion de coop d’habitat”.

## AS-IS (aujourd’hui)

- Atlas couvre le CRM immobilier “dossiers/annonces/rdv/messages/consentement/audit/timeline”.
- Pas de gestion de groupements, de cotisations, ni d’allocation de lots.

## TO-BE (cible MVP v1 Coop Habitat)

## Nomenclature (codes)

Les codes utilisés dans ce module suivent la convention décrite dans :
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

En particulier :
- Types: `COOP_GROUP`, `COOP_PROJECT`
- Statuts group: `COOP_GROUP_*`
- Statuts projet: `COOP_PROJECT_*`
- Statuts allocation: `COOP_ALLOC_*`
- Statuts membre: `COOP_MEMBER_*`



### Périmètre inclus (V1)
1. **Group (Coop/Groupement)** : création, règles, statut, documents.
2. **Membres** : onboarding (KYC “light” documentaire), rôles, rang FIFO, statut.
3. **Plan de cotisation** : échéancier, indexation (paramétrable), pénalités de retard, cut-off.
4. **Ledger (journal)** : enregistrement des contributions (montant, date, justificatif, statut).
5. **Projet** : jalons (terrain, permis, chantier, livraison), budget simplifié.
6. **Lots** : création des lots (A1/A2…), surface/type, disponibilité.
7. **Allocation** : proposition/validation d’allocation (FIFO + condition “membre à jour”), preuve (PV).
8. **Communication WhatsApp** : appels de fonds, rappels, notifications jalons, notifications d’allocation.
9. **Traçabilité** : audit + timeline automatique sur actions critiques.

### Hors périmètre (V1)
- Paiements intégrés / wallet / escrow.
- Marketplace d’entreprises / appels d’offres automatisés.
- Financement relais (bridge) automatisé.
- Conformité financière avancée (KYC/AML lourd) — possible V2 selon stratégie.

---

# 1) Modèle fonctionnel (humain)

## 1.1 Concepts clés

### FIFO d’allocation (principe)
- Le rang FIFO détermine **l’ordre de priorité** pour obtenir un lot (**choix/attribution**).
- La **livraison** dépend du projet (chantier) : un membre peut être “attribué” mais pas “livré”.

### Cotisation croissante (principe)
La contribution peut augmenter avec le temps pour refléter :
- inflation / coût de construction,
- “prime de risque” (les premiers payent moins car le projet est plus incertain).

**Exigence produit** : la formule doit être lisible (table d’échéances + explication), et versionnée.

## 1.2 Rôles (au minimum)
- **ADMIN_ORG** : paramètre et supervise (multi-tenant).
- **COOP_MANAGER** : gère le groupement, valide décisions, lance appels de fonds.
- **COOP_MEMBER** : consulte, dépose justificatifs, reçoit notifications.
- **AUDITOR/VIEWER** (optionnel) : lecture seule (transparence).

---

# 2) Workflows (templates)

## 2.1 Workflow Group (COOP_GROUP)
Template :
- `COOP_GROUP_FORMATION` → `COOP_GROUP_KYC_READY` → `COOP_GROUP_FUNDING_OPEN` → `COOP_GROUP_THRESHOLD_REACHED` → `COOP_GROUP_FUNDING_CLOSED` → `COOP_GROUP_ALLOCATION_RUNNING` → `COOP_GROUP_COMPLETED`
- branches : `COOP_GROUP_CANCELLED`, `CRM_ON_HOLD`

Règles :
- passage à `COOP_GROUP_FUNDING_OPEN` interdit tant que les règles de cotisation et le plan sont validés.
- passage à `COOP_GROUP_ALLOCATION_RUNNING` interdit tant que le projet n’a pas des lots définis.

## 2.2 Workflow Project (COOP_PROJECT)
Template :
- `COOP_PROJECT_LAND_SECURED` → `CRM_PERMITS` → `CRM_CONTRACTING` → `CRM_BUILDING` → `CRM_DELIVERY` → `COOP_PROJECT_HANDOVER` → `COOP_PROJECT_CLOSED`
- branches : `CRM_ON_HOLD`, `COOP_GROUP_CANCELLED`

Règle :
- la livraison (`CRM_DELIVERY/COOP_PROJECT_HANDOVER`) déclenche des notifications et des mises à jour d’état de lots.

## 2.3 Workflow Allocation (COOP_ALLOCATION)
Template :
- `PROPOSED` → `VALIDATED` → `ASSIGNED` → `COOP_PROJECT_CLOSED`
- branch : `CRM_REJECTED` (si membre non éligible ou contestation)

Règles :
- FIFO ne s’applique que si le membre est `ACTIVE` et “à jour” au **cut-off**.
- toute allocation doit être justifiée (PV/decision document).

---

# 3) Journeys (parcours MVP)

1. **Créer un groupement**
   - COOP_MANAGER crée `Group`, ajoute règle FIFO + formule d’indexation, ajoute documents (statuts).
2. **Onboard membres**
   - ajout membres, rang FIFO, statut `PENDING_KYC` → `ACTIVE` après pièces.
3. **Ouvrir collecte**
   - `COOP_GROUP_FUNDING_OPEN`, génération échéances, WhatsApp “appel de fonds”.
4. **Déclarer cotisations**
   - membre dépose preuve, ledger enregistre `PENDING` → `CONFIRMED`.
5. **Attribution d’un lot**
   - au jalon “allocation”, le système propose selon FIFO ; manager valide (PV).
6. **Suivre projet**
   - mise à jour jalons, notifications “permis ok”, “chantier démarré”, etc.
7. **Livraison**
   - `CRM_DELIVERY/COOP_PROJECT_HANDOVER`, notification, clôture.

---

# 4) Événements & preuves (audit/timeline)

Chaque action critique doit produire :
- **AuditEvent** (qui/quand/quoi + diff),
- **Activity** (timeline) :
  - `STATUS_CHANGE` (auto),
  - `DOCUMENT_LOG` (PV/justificatifs),
  - `SYSTEM` (notifications envoyées).

---

# 5) Notifications WhatsApp (Choix B)

Notifications “must-have” :
- Appel de fonds (nouvelle échéance)
- Rappel avant échéance (J-3, J-1)
- Retard / pénalité
- Publication PV / décision
- Attribution lot (proposé/validé/attribué)
- Jalons projet (permis, chantier, livraison)

Voir le détail des règles d’outbound : `docs/atlas-immobilier/03_technique/09_notifications.md`.