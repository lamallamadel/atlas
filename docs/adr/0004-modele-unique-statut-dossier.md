# ADR 0004 : Modèle unique de statut de dossier (`case_type` + `status_code`)

## Status
Accepté (2026-11-23). Mise en œuvre en trois phases, voir « Plan de migration ».

## Contexte

L’entité `Dossier` porte deux modèles de statut qui se recouvrent.

| Modèle | Où | Rôle actuel |
|---|---|---|
| Enum `DossierStatus` : `NEW`, `QUALIFYING`, `QUALIFIED`, `APPOINTMENT`, `WON`, `LOST` | colonne `status` (NOT NULL) ; `DossierStatusTransitionService` (matrice codée en dur) ; `DossierStatusHistory.fromStatus/toStatus` | **Seul modèle réellement utilisé.** Lu par 19 classes backend (dashboards, reporting, doublons, matching, imports, WhatsApp…) et 18 fichiers frontend (kanban, liste, détail, widgets) |
| `case_type` + `status_code` (chaînes) | colonnes du même nom ; référentiels `CASE_TYPE` / `CASE_STATUS` ; `WorkflowDefinition` (V120 : `states_json`, `transitions_json`, versionné) ; `DossierStatusCodeValidationService`, `WorkflowValidationService` | `status_code` est recopié depuis l’enum (`deriveStatusCodeFromEnumStatus` renvoie `status.name()`). `case_type` n’est renseigné par aucun écran Pro |

Constats vérifiés le 2026-11-23 sur `master` (`6c3db9ad`), par un test E2E H2 jetable :

1. **Tout dossier créé avec un `caseType` est refusé (400).** Les référentiels sont lus par organisation ; V15 ne les a semés que pour `DEFAULT-ORG`, et le semis à la volée (`referential.seed-on-missing`) est désactivé par défaut. `CRM_LEAD_BUY` est refusé comme `DEMO`. Conséquence en prod : **le formulaire démo de la vitrine (`caseType: 'DEMO'`) échoue à chaque envoi.**
2. **Un dossier qui aurait un `caseType` ne pourrait jamais changer de statut.** V120 a supprimé puis recréé `workflow_definition` (le semis V17 a disparu) et `WorkflowDefinitionRepository.findActiveTransition` est devenu une méthode `@Deprecated` qui renvoie toujours vide ; `WorkflowValidationService` lève alors une `WorkflowValidationException` sur toute transition.
3. `WorkflowValidationService` compare des noms d’enum (`WON`, `LOST`) et des codes (`CRM_QUALIFIED`, `CRM_VISIT_DONE`) : les règles par rôle et les préconditions ne se déclenchent jamais.
4. Le référentiel `CASE_STATUS` contient à la fois les codes `CRM_*` de la nomenclature et les noms de l’enum.
5. Les tests E2E dossiers passent tous `caseType = null` pour contourner la validation de workflow.

Le produit doit pourtant porter plusieurs métiers (achat, location, mandat, démo B2B, plus tard coop) avec des pipelines différents. L’enum ne le permet pas sans modifier le code à chaque métier.

## Alternatives envisagées

1. **Enum seul.** Supprimer `case_type`/`status_code`, les référentiels de statut et le moteur de workflow. Simple, mais chaque nouveau métier demande une release, et la spec (référentiels modulables, pipeline B2B) devient inatteignable.
2. **Les deux, synchronisés.** Statu quo amélioré : l’enum reste la vérité, `status_code` en est un reflet. Ne règle aucun des constats et garde deux sources de vérité.
3. **`case_type` + `status_code` comme seule vérité, piloté par `WorkflowDefinition`.** Retenu.

## Décision

1. **Vérité unique.** Un dossier a toujours un `case_type` et un `status_code` (NOT NULL). La colonne `status` et l’enum `DossierStatus` deviennent une projection de compatibilité, puis disparaissent.
2. **Un workflow par type de dossier.** Les états et transitions d’un `case_type` viennent de la `WorkflowDefinition` publiée et active de l’organisation, à défaut du modèle système (`is_template = true`). Le dossier mémorise `workflow_definition_id` et `workflow_version` à sa création ; une nouvelle version ne s’applique qu’aux nouveaux dossiers.
3. **Chaque état porte sa sémantique.** Dans `states_json`, chaque état déclare au minimum :
   - `stage` : `OPEN`, `WON` ou `LOST` (terminalité et issue) ;
   - `funnelStep` : position dans l’entonnoir commun (`NEW`, `QUALIFICATION`, `VISIT`, `OFFER`, `CLOSING`) ;
   - `requires` : champs exigés pour y entrer (`lossReason`, `wonReason`, rendez-vous…).
   Le code métier, le reporting et le frontend lisent `stage` et `funnelStep`, **jamais un code de statut précis**. C’est ce qui permet d’ajouter un métier sans toucher au code.
4. **Codes de la nomenclature.** Les statuts suivent `00_nomenclature_codes.md` (`CRM_*`, `B2B_*`, `COOP_*`). Correspondance pour le pipeline existant :

   | Enum actuel | `status_code` cible | `stage` | `funnelStep` |
   |---|---|---|---|
   | `NEW` | `CRM_NEW` | OPEN | NEW |
   | `QUALIFYING` | `CRM_QUALIFYING` (à ajouter au référentiel) | OPEN | QUALIFICATION |
   | `QUALIFIED` | `CRM_QUALIFIED` | OPEN | QUALIFICATION |
   | `APPOINTMENT` | `CRM_VISIT_PLANNED` | OPEN | VISIT |
   | `WON` | `CRM_CLOSED_WON` | WON | CLOSING |
   | `LOST` | `CRM_CLOSED_LOST` | LOST | CLOSING |

5. **Type par défaut.** Les dossiers existants et ceux créés sans type reçoivent `CRM_LEAD` (lead générique, workflow identique à la matrice actuelle). `CRM_LEAD_BUY`, `CRM_LEAD_RENT`, puis `CRM_LEAD_B2B_DEMO` ont leur propre modèle système.
6. **Référentiels système.** Les codes système (`is_system = true`) sont lus sans dépendre d’un semis par organisation ; une organisation peut ajouter ou désactiver des codes, pas en dépendre pour fonctionner.
7. **Contrat API.**
   - `GET /api/v1/dossiers/{id}/transitions` renvoie les transitions possibles depuis l’état courant (code, libellé, champs requis). L’UI n’affiche que celles-ci.
   - `PATCH /api/v1/dossiers/{id}/status` accepte `statusCode` ; `status` (enum) reste accepté pendant la transition et est traduit par la table ci-dessus.
   - Les réponses exposent `caseType`, `statusCode`, `stage`, `funnelStep` ; `status` reste présent, déprécié, jusqu’à la phase C.

## Plan de migration

| Phase | Contenu | Comportement visible |
|---|---|---|
| **A — Fondations** | V157 : `CRM_LEAD` (type) et `CRM_QUALIFYING` (statut) au référentiel, référentiels système lisibles sans semis, modèles de workflow système (`CRM_LEAD`, `CRM_LEAD_BUY`, `CRM_LEAD_RENT`) en `states_json`/`transitions_json`, backfill `case_type = 'CRM_LEAD'` et `status_code` mappé sur les dossiers existants. Réécriture de `findActiveTransition` sur `transitions_json`. Tests E2E avec `caseType` renseigné | Aucun, sauf : la création avec `caseType` fonctionne, le formulaire démo de la vitrine aussi |
| **B — Écriture** | Le service de transition valide via le workflow du dossier et écrit `status_code` ; l’enum `status` est recalculé depuis `stage`/`funnelStep`. Endpoint `GET …/transitions`. `DossierStatusHistory` gagne `from_code`/`to_code`. Les règles terminal/raison passent dans `requires` | Les actions de statut viennent de l’API, plus d’une liste codée dans le front |
| **C — Lecture** | Les 19 classes backend et 18 fichiers frontend lisent `stage`/`funnelStep`/`statusCode`. Libellés depuis le référentiel. Suppression de `DossierStatusTransitionService`, de l’enum et de la colonne `status` (migration dédiée) | Kanban par colonnes du workflow du type de dossier |

Chaque phase est une branche à part, testée sur H2 et PostgreSQL. La phase A est un prérequis du pipeline B2B démo (étape 7 du backlog).

## Conséquences

### Positives
- Un nouveau métier (location, mandat, B2B, coop) = un modèle de workflow et des codes de référentiel, sans release backend.
- Une seule source de vérité ; la spec (`03_referentiels_workflows_modulables.md`, `08_workflow_b2b_demo.md`) devient réalisable telle quelle.
- Le reporting reste comparable entre métiers grâce à `stage` et `funnelStep`.
- Corrige au passage les deux défauts constatés (création refusée, transitions impossibles).

### Négatives
- Migration en trois temps sur un domaine central ; la phase C touche une quarantaine de fichiers.
- Les requêtes de reporting et de doublons passent d’une comparaison d’enum à une lecture de sémantique d’état : il faut soit dénormaliser `stage` sur `dossier`, soit joindre. **Recommandation : dénormaliser `stage` et `funnel_step` sur `dossier`** (mis à jour à chaque transition, indexés), pour garder des requêtes simples.
- Les workflows modifiables par organisation exigent une validation à la publication (état initial présent, états terminaux atteignables, codes existants au référentiel).

## Références
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`
- `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`
- Migrations : `V15__Seed_default_referentials.sql`, `V17__Seed_default_workflows.sql`, `V120__Enhance_workflow_system.sql`
