# Backlog — Exécution MVP (Portail + Biz + Pro)

> **Statut**: Source de vérité (ordre de travail)  
> **Dernière vérification**: 2026-11-23  
> **Dépendances**:  
- `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md` (l’existant)  
- `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md` (critères d’acceptation)

Objectif : rendre la plateforme vendable à une **deuxième agence**. L’ordre ci-dessous a été fixé le 2026-11-23 après la relecture specs vs code. Chaque étape = une branche partant de `master`.

## Ordre de travail

| # | Étape | Contenu | Critères E2E | État |
|---|---|---|---|---|
| 1 | Doc réalignée | État d’avancement réécrit, archive déplacée, contradictions corrigées, règles de consentement | — | Fait (branche `docs/cleanup-specs`) |
| 2 | ADR 0004 — statut de dossier | Modèle unique `case_type` + `status_code` piloté par `WorkflowDefinition` ; plan de migration depuis l’enum `DossierStatus` | — | Décidé, à écrire |
| 3 | Leads publics multi-agences | Le lead prend l’`org_id` de l’annonce ; endpoint public de détail d’annonce ; test avec deux agences | B3, B4 | À faire |
| 4 | Publication gouvernée | Statuts `DRAFT → PUBLISHED → SUSPENDED → ARCHIVED` (fusion de `ACTIVE`/`PAUSED`), score de qualité + champs manquants, minimum de photos, score de doublon (`brain/dupli`) + override manager | A1–A6, B1 | À faire |
| 5 | Signalements et modération | Entité de signalement, envoi depuis le portail, liste Pro, clôture, suspension de l’annonce | B5+ | À faire |
| 6 | Rôles d’agence | `MANAGER` et `AGENT` (Keycloak), filtre « mes dossiers », réassignation réservée au manager | — | À faire |
| 7 | Ensuite | Pipeline B2B démo (`CRM_LEAD_B2B_DEMO`), feature flags appliqués côté API, écrans Coop | — | Plus tard |

## Décisions ouvertes (hors chemin critique)
- WhatsApp : autoriser un pitch dans la fenêtre de 24 h d’un message client.
- WhatsApp : accepter un « OUI » dans la conversation comme opt-in.

## Definition of Done (global)
- Scénarios E2E « MVP Acceptance » satisfaits : `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md`.
- Tests backend H2 verts ; test d’isolation à deux agences pour tout flux public.
- Audit events sur les actions sensibles (publication, suspension, réassignation, décision de modération).
- `00_etat_avancement_mvp.md` mis à jour dans la même branche.
