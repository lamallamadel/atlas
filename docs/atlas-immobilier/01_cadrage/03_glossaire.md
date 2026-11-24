# Glossaire (métier & produit)

> **Statut**: Stable (référence)  
> **Dernière vérification**: 2026-11-25  
> **Source of truth**: Oui (terminologie — alignement docs + UI + API)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## A
**Annonce (Annonce)** : bien publié (vente/location) avec médias, prix, géolocalisation, attributs, et règles de qualité.  
**Agent / Conseiller** : utilisateur opérationnel qui qualifie les Dossiers, planifie RDV et convertit.  
**AuditEvent** : événement immuable retraçant une action sensible (qui/quoi/quand + diff optionnel).  

## B
**Bien (`property`)** : le logement ou terrain d'un propriétaire, décrit une fois dans son espace. Une ou plusieurs annonces le diffusent (la sienne, celles des agences mandatées).  
**Bourse aux mandats** : écran Pro listant, de façon anonymisée, les demandes d'accompagnement des propriétaires de la zone de l'agence.  

## C
**Case / Dossier** : unité centrale de suivi (prospect + intention + pipeline + timeline). Un Dossier porte un `case_type_code` et un `status_code`.  
**Consentement** : preuve qu’une personne accepte d’être contactée (et éventuellement de recevoir du marketing), stockée et auditée.  
**CRM** : espace Pro de traitement des Dossiers (pipeline, tâches, notes, reporting).  
**Coop Habitat** : module de groupement (membres, cotisations, allocation, projet) nécessitant gouvernance et conformité.

## D
**Demande d'accompagnement** : demande ouverte par un propriétaire pour trouver un agent (objectif, prix, délai, services, commission envisagée) ; reçoit des propositions d'agences.  
**Déduplication** : détection de doublons (annonce ou dossier) via règles/empreintes (téléphone, zone, contenu, médias).  
**Dictionnaire de données** : définition des champs et contraintes du modèle (voir doc technique dédiée).  

## E
**Espace propriétaire** : partie de l'application réservée aux comptes `OWNER` : biens, annonce, contacts, visites, propositions, mandats.  

## F
**Feature flag / Entitlement** : activation/désactivation d’un module pour une organisation + quotas/limites.  
**Financement** : parcours de pré‑qualification et routage vers partenaires (courtiers/banques).

## G
**Gestion locative** : gestion opérationnelle d’une location (quittances, incidents, maintenance, prestataires).  
**Gouvernance** : règles et preuves de décision (PV) dans le cadre de projets ou coop.

## L
**Lead-to-Deal** : chaîne complète contact → qualification → RDV → offre → closing, instrumentée par la timeline/audit.  
**Lot** : unité vendue/allouée dans un programme neuf ou un projet coop.

## M
**Machine à états** : validation contrôlée des transitions de statut (voir doc workflow).  
**Mandat** : accord par lequel un propriétaire confie la vente ou la location de son bien à une agence. **Simple** : plusieurs agences possibles et le propriétaire garde le droit de vendre ; **exclusif** : une seule agence pendant sa durée. Ce n'est pas une procuration.  
**Modération** : processus de revue/suspension/retrait d’annonces en cas de fraude, doublon, non‑conformité.  
**Multi‑tenancy (`org_id`)** : isolation stricte des données par organisation.

## N
**Neuf / Promoteur** : programmes et lots, avec disponibilité et suivi showroom.

## O
**Organisation personnelle** : organisation (`org_type = OWNER`) créée pour chaque propriétaire, dont il est l'unique membre (ADR 0005).  

## P
**Pipeline** : enchaînement de statuts d’un Dossier (ex: `CRM_NEW` → … → `CRM_CLOSED_WON/LOST`), défini par workflow.  
**Proposition** : réponse d'une agence à une demande d'accompagnement (type et durée de mandat, commission, services, estimation, message).  

## R
**RDV (Appointment)** : visite/appel planifié, lié à un Dossier et potentiellement à une Annonce.  
**Référentiel** : liste de codes stables tenant‑scopés (statuts, raisons, types) stockée en base.

## T
**Timeline** : historique consolidé d’un Dossier (messages, événements, tâches, RDV, décisions).  
**Trust layer** : ensemble des mécanismes de confiance (qualité, dédup, modération, badges, KYC).  

## W
**WhatsApp-first** : UX orientée WhatsApp (capture, tracking, intégration API future).
