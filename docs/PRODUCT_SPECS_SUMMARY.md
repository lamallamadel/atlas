# Atlas Immobilier — Périmètre produit (résumé)

Ce document résume le **périmètre fonctionnel** visé par Atlas Immobilier à moyen terme (au-delà du CRUD initial), tel que consolidé dans les échanges ChatGPT.

## Vision

Atlas Immobilier est un CRM immobilier multi-tenant (par organisation) destiné à gérer :

- Les **annonces** (catalogue, règles, publication)
- Les **dossiers** (pipeline, qualification, conversion)
- Les **contacts/parties prenantes** (lead, buyer, seller, agent)
- Les **consentements** (RGPD par canal) et la communication omnicanale (WhatsApp en priorité)

## Fonctions majeures attendues

- **Messagerie & timeline d’activité** (entrant/sortant, EMAIL/SMS/PHONE/WHATSAPP)
- **Audit trail** (journal des changements) avec diffs JSON et consultation par entité
- **Consentements** : preuves, horodatage, métadonnées et règles bloquantes avant envoi
- **Workflow dossier** : transitions autorisées et règles métier centrales
- **RDV (appointments)** : planification, statuts, anti-conflit, rappels
- **Qualification** : règles (JSON) + extraction heuristique + score + raisons + historisation
- **Import/Export** : CSV + mapping + rapports d’erreurs
- **Reporting** : KPIs (taux qualif, taux RDV, no-show, conversion, temps de réponse)

## Où trouver la planification

- Roadmap MVP (S1–S13) : `docs/MVP_ROADMAP.md`
- État d’avancement : `docs/PROJECT_STATUS.md`
