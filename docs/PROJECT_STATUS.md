# Atlas Immobilier — État du projet

## Situation actuelle (au 2026-01-04)

Le projet **Atlas Immobilier** (CRM immobilier) a complété les **Semaines 1 à 3** sur le plan fonctionnel.

- **S1 (Baseline prod-ready)** : terminée
- **S2 (DB + CRUD core Annonce/Dossier + UI)** : terminée
- **S3 (Auth/RBAC + Multi-tenant + durcissement API)** : terminée fonctionnellement

Pour considérer la S3 **clôturée**, il reste des correctifs de cohérence Frontend / contrat API.

## Correctifs de fermeture — Semaine 3 (priorité haute)

1. **DTO create** : retirer `orgId` de `AnnonceCreateRequest` et `DossierCreateRequest` (source unique = header `X-Org-Id`).
2. **AnnonceStatus** : aligner FE avec BE (`DRAFT`, `PUBLISHED`, `ACTIVE`, `PAUSED`, `ARCHIVED`) + badges/libellés FR.
3. **DossierResponse** : compléter FE avec `score`, `source`, `parties`, `existingOpenDossierId` + afficher dans l’UI (score/source, bandeau doublon, liste parties).
4. **UI Dossier** : `orgId` uniquement dans la section “Avancé” (pas dans “Système”).
5. **Internationalisation FR** : uniformiser les messages système (interceptors/guards) actuellement en anglais.
6. **Filtre Annonce sur liste dossiers** : remplacer le champ “ID annonce” par un select/autocomplete (basé titre) pour cohérence UX.

## Prochaine étape — Semaine 4

Objectif : renforcer l’usage CRM autour du **pipeline dossier**.

- Transitions de statut + règles MVP
- AuditEvent systématique + consultation (viewer minimal)
- Notes / tâches internes sur dossier (API + UI)
- Ajustements recommandés : **PartiePrenante CRUD v1** (contacts/roles) + **E2E smoke** (Playwright)

## Documentation associée

- Roadmap : `docs/MVP_ROADMAP.md`
- Scénarios UAT : `docs/UAT_SCENARIOS.md`
- Changelog : `CHANGELOG.md`
