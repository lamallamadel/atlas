# Personas & périmètre

> **Statut**: Stable (cadrage)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PRODUCT_SPECS_SUMMARY.md`
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## Personas
- **Agent / Conseiller** : qualifie et suit les leads, planifie RDV, pilote son pipeline.
- **Responsable agence** : supervise KPI, qualité de traitement, conversion.
- **Propriétaire / Vendeur** (indirect) : donne des informations et suit l’avancement.
- **Prestataires** (architecte, entreprise) : participent à l’activité d’un dossier.

## Périmètre fonctionnel (MVP+)
- Annonces : CRUD + visibilité/qualité.
- Dossiers : CRUD + statut + assignation + filtrage.
- Timeline : messages, appels, événements.
- Audit : journal de changements immuable.
- Consentements : opt-in/out par canal et par personne.
- Reporting : dashboard KPI (funnel, délais, sources).
- Notifications : email/sms (scénarios clés).

## Persona additionnel (TO-BE) — Responsable de coop / Groupement

- Objectif : piloter un projet immobilier collectif en réduisant les conflits et en améliorant la transparence.
- Besoins : gouvernance (PV/décisions), suivi des cotisations (ledger), allocation des lots, communication WhatsApp, preuves/audit.
- Risques : défauts de paiement, contestations, dérive des coûts.

Le module associé est spécifié dans : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.
