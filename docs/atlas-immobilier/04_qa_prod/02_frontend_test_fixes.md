# Correctifs tests Front (FE.zip) — notes de stabilisation

> **Statut**: Partiel (AS-IS)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/UAT_SCENARIOS.md`

## 1) Provider HttpClient manquant (DashboardKpiService)
Symptôme :
- `NullInjectorError: No provider for HttpClient!`

Correctif :
- importer `HttpClientTestingModule` dans le spec du service.

## 2) Format booléen (GenericTableComponent)
Symptôme :
- le test attend `Yes/No` alors que l’UI FR renvoie `Oui/Non`.

Correctif :
- aligner les attentes du test sur `Oui/Non` ou rendre la traduction injectable (option future).

## 3) Locale DatePipe (DossiersComponent)
Symptôme :
- `Missing locale data for locale "fr-FR"` via `DatePipe`.

Correctif :
- `registerLocaleData(localeFr)` et `LOCALE_ID = 'fr-FR'` dans le module de test.

## 4) Recommandations générales
- Ajouter `NoopAnimationsModule` dans les tests de composants Material.
- Utiliser `NO_ERRORS_SCHEMA` pour ignorer les composants enfants hors périmètre du test unitaire.
- Privilégier `overrideTemplate(Component, '')` si le rendu HTML déclenche des pipes/child components non requis.
