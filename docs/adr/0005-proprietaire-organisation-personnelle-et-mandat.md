# ADR 0005 : Le propriétaire a sa propre organisation ; le mandat relie propriétaire et agence

## Status
Proposé (2026-11-25), à valider avec la spec `docs/atlas-immobilier/02_fonctionnel/13_uc_proprietaire_mandats.md`.

## Contexte

Le cas d'usage n°1 fait entrer un nouvel acteur : le propriétaire particulier. Il publie seul ou confie son bien à une agence, et doit suivre son affaire.

Aujourd'hui :
- toute donnée appartient à une organisation (`org_id`) et le filtre Hibernate `orgIdFilter` isole strictement les agences (ADR 0003) ;
- une organisation n'existe que comme chaîne `org_id` (pas de table, pas de type) ; les comptes Keycloak sont des membres d'agence (`ADMIN`, `MANAGER`, `AGENT`) ou `SUPER_ADMIN` ;
- une annonce appartient à l'agence qui la publie ; il n'existe pas de « bien » distinct de l'annonce ;
- les leads du portail prennent l'`org_id` de l'annonce (étape 3).

Il faut décider où vivent les données du propriétaire, et comment une agence accède à un bien qui ne lui appartient pas.

## Alternatives envisagées

1. **Une organisation « Particuliers » commune** qui contient tous les propriétaires. Simple à créer, mais tous les propriétaires partagent le même tenant : il faudrait un second filtre par propriétaire sur chaque entité (annonces, leads, messages, RDV). C'est une isolation refaite à la main, au même niveau de risque qu'une fuite entre agences.
2. **Pas d'organisation : données rattachées à l'utilisateur** (`owner_user_id`). Le propriétaire ne pourrait réutiliser ni les dossiers, ni la messagerie, ni les RDV, tous filtrés par `org_id`. Il faudrait des modèles parallèles.
3. **Une organisation par propriétaire** (`org_type = OWNER`, un seul membre). Retenu.

Pour le lien avec l'agence :

- a. **Partager l'annonce du propriétaire avec l'agence** (droit d'accès inter-orgs sur des lignes existantes). Rompt le principe « une ligne = une organisation » et oblige à affaiblir le filtre.
- b. **Transférer l'annonce à l'agence.** Le propriétaire perd la main et l'historique ; impossible en mandat simple (plusieurs agences).
- c. **Un objet explicite, le mandat, porté par les deux organisations, et un bien commun** (`property`) que chaque annonce référence. Retenu.

## Décision

1. Une table `organization` (`org_id`, `org_type` : `AGENCY`, `OWNER`, `PLATFORM`, nom affiché, `verified`) devient le registre des organisations. Les `org_id` existants y sont repris en `AGENCY`.
2. L'inscription d'un propriétaire crée un compte Keycloak de rôle `OWNER` et une organisation `OWNER` dont il est l'unique membre. Tout ce qu'il produit (biens, annonces, leads, messages, RDV) porte cet `org_id` et reste isolé par le mécanisme actuel, sans changement.
3. Le **bien** (`property`) appartient à l'organisation du propriétaire. Toute annonce peut référencer un `property_id` ; une annonce d'agence le fait quand elle diffuse un bien reçu sous mandat.
4. Les objets qui relient un propriétaire et une agence (`mandate_request`, `mandate_proposal`, `mandate`, `marketplace_thread`, `agency_review`) sont **inter-organisations** : ils portent `owner_org_id` et `agency_org_id`, n'étendent pas le filtre `orgIdFilter`, et ne sont lus qu'à travers un service unique (`MandateAccessService`) qui vérifie l'appartenance à l'une des deux organisations et ce que le statut autorise.
5. À l'acceptation d'une proposition, les données utiles au mandat (coordonnées du propriétaire, adresse du bien) sont **copiées** dans le dossier `CRM_MANDATE_*` créé dans l'organisation de l'agence. L'agence travaille ensuite dans son tenant, sans lecture inter-orgs.
6. Le propriétaire suit l'affaire par les événements du dossier que l'agent marque « visibles par le propriétaire », exposés par le même service d'accès. Il ne lit jamais le dossier de l'agence directement.
7. Le rôle `OWNER` donne `ROLE_OWNER` et pas `ROLE_PRO` : aucune route Pro n'est accessible à un propriétaire.

## Conséquences

**Positives**
- Isolation inchangée et éprouvée : un propriétaire est un tenant comme un autre.
- Réutilisation directe des annonces, leads, messagerie, RDV, règles de publication et du routage des leads par `org_id`.
- Le mandat est un objet métier traçable (statut, dates, commission, preuve d'acceptation), et non un droit d'accès caché.
- Un même bien diffusé par plusieurs agences en mandat simple est identifiable (`property_id`), ce qui règle les faux doublons.

**Négatives**
- Beaucoup d'organisations d'une seule personne : les traitements par organisation (tâches planifiées, semis de référentiels, quotas, réglages WhatsApp) doivent ignorer ou traiter à part le type `OWNER`. À inventorier au lot A.
- Les référentiels lus par organisation (ADR 0004, constat 1) doivent exister pour les organisations `OWNER` : semis à la création ou lecture du référentiel plateforme.
- Un service inter-orgs est un point sensible : il concentre les contrôles et doit être couvert par des tests d'isolation (deux agences + un propriétaire) à chaque lot.
- La copie des données vers l'agence au mandat crée deux exemplaires : une modification ultérieure par le propriétaire doit être notifiée à l'agence, pas propagée silencieusement.

## Plan

- **Lot A** : table `organization` (V163+), type `OWNER`, rôle Keycloak `OWNER` et mapping `SecurityConfig`, création de l'organisation à l'inscription, `property`, `annonce.property_id` et `publisher_kind`, inventaire des traitements par organisation.
- **Lot B** : entités inter-orgs, `MandateAccessService`, workflow `CRM_MANDATE_SALE` / `CRM_MANDATE_RENT` dans `DossierWorkflowCatalog`, copie des données à l'acceptation.
- **Lot C** : événements « visibles propriétaire », avis, score de matching.
