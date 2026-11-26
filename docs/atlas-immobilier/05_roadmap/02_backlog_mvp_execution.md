# Backlog — Exécution MVP (Portail + Biz + Pro)

> **Statut**: Source de vérité (ordre de travail)  
> **Dernière vérification**: 2026-11-25  
> **Dépendances**:  
- `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md` (l’existant)  
- `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md` (critères d’acceptation)

Objectif : rendre la plateforme vendable à une **deuxième agence**. L’ordre ci-dessous a été fixé le 2026-11-23 après la relecture specs vs code. Chaque étape = une branche partant de `master`.

## Ordre de travail

| # | Étape | Contenu | Critères E2E | État |
|---|---|---|---|---|
| 1 | Doc réalignée | État d’avancement réécrit, archive déplacée, contradictions corrigées, règles de consentement | — | Fait (branche `docs/cleanup-specs`) |
| 2 | ADR 0004 — statut de dossier | Modèle unique `case_type` + `status_code` piloté par `WorkflowDefinition` ; plan de migration depuis l’enum `DossierStatus` | — | Fait : phases A et B (phase C à venir) |
| 3 | Leads publics multi-agences | Le lead prend l’`org_id` de l’annonce ; endpoint public de détail d’annonce ; test avec deux agences | B3, B4 | Fait |
| 4 | Publication gouvernée | Statuts `DRAFT → PUBLISHED → SUSPENDED → ARCHIVED` (fusion de `ACTIVE`/`PAUSED`), score de qualité + champs manquants, minimum de photos, score de doublon (`brain/dupli`) + override manager | A1–A6, B1 | Fait |
| 5 | Signalements et modération | Entité de signalement, envoi depuis le portail, liste Pro, clôture, suspension de l’annonce | B5+ | Fait |
| 6 | Rôles d’agence | `MANAGER` et `AGENT` (Keycloak), filtre « mes dossiers », réassignation réservée au manager | — | Fait |
| 7 | Pipeline B2B, modules, Coop | Pipeline B2B démo (`CRM_LEAD_B2B_DEMO`), feature flags appliqués côté API, écrans Coop | — | Fait (+ stabilisation, branche `chore/release-stabilization`) |
| 8 | Cas d'usage n°1 — lot A : propriétaire autonome | Rôle `OWNER`, table `organization`, organisation personnelle, code à usage unique, bien (`property`), annonce du propriétaire avec modération a priori, leads et visites dans l'espace propriétaire (spec `02_fonctionnel/13_uc_proprietaire_mandats.md`, ADR 0005) | PA-1 à PA-4, PA-5 | Fait (branches `feat/uc-proprietaire-lot-a` et `feat/uc-proprietaire-lot-a-messagerie`) ; reste le rappel de visite |
| 9 | Cas d'usage n°1 — lot B : bourse aux mandats | Demande d'accompagnement ouverte ou directe (bien privé possible), annuaire et profils d'agence, zones, bourse, propositions, messagerie masquée, mandat, dossier `CRM_MANDATE_*`, exclusivité | PB-1 à PB-8 | Fait (branche `feat/uc-proprietaire-lot-b`) ; restent le document de mandat et la signature en ligne |
| 10 | Cas d'usage n°1 — lot C : matching et suivi | Score agents ↔ demande, invitations, acquéreurs compatibles de l'agence, suivi du mandat par le propriétaire, avis, badges, quotas | PC-1 à PC-4 | Fait (branche `feat/uc-proprietaire-lot-c`), avec les alertes aux agences et les offres ; Q7 toujours ouverte |

## Décisions ouvertes (hors chemin critique)
- WhatsApp : autoriser un pitch dans la fenêtre de 24 h d’un message client.
- WhatsApp : accepter un « OUI » dans la conversation comme opt-in.
- Cas d'usage n°1 : questions Q5 à Q8 de `02_fonctionnel/13_uc_proprietaire_mandats.md` § 17.

## Definition of Done (global)
- Scénarios E2E « MVP Acceptance » satisfaits : `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md`.
- Tests backend H2 verts ; test d’isolation à deux agences pour tout flux public (deux agences et un propriétaire à partir de l'étape 8).
- Audit events sur les actions sensibles (publication, suspension, réassignation, décision de modération).
- `00_etat_avancement_mvp.md` mis à jour dans la même branche.
