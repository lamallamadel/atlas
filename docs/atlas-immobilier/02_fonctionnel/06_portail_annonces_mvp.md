# Portail d’annonces — Spécification UI (MVP)

> **Domaine**: `atlasia.ma`  
> **Statut**: TO-BE (cible MVP)  
> **Source of truth**: Oui (pour le portail public)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md` (codes TX/ANN/REPORT/CHAN…)  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md` (contrats génériques)  

## Objectifs MVP

1. Permettre aux utilisateurs de **trouver** des annonces (vente/location) via recherche + filtres.
2. Offrir une fiche annonce **claire** et **fiable**.
3. Convertir en **contact** (WhatsApp + formulaire) et créer un **lead** dans le CRM.
4. Respecter strictement les règles d’exposition : **seules les annonces publiables** sont visibles.

## Pages (IA)

- **Home** : `/`
- **Recherche (liste + carte)** : `/annonces` (+ variantes ville/tx)
- **Détail annonce** : `/annonce/{slug}-{id}`
- **Contact** : intégré à la page détail (modal ou section)
- **Signaler annonce** : intégré à la page détail (modal)
- **Mentions / Confidentialité** : pages statiques

## Règles de visibilité (alignées référentiel)

Une annonce est visible publiquement si :
- `listing.status_code` ∈ **statuts publiables** (référentiel `ANN_STATUS`)
- ET aucun blocage modération (`MOD_*`) si applicable.

**Comportement** : si non visible → **404** (ou page “indisponible” sans détails sensibles).

## Convention d’URLs (SEO)

- Home : `/`
- Recherche :
  - `/annonces`
  - `/annonces/vente` / `/annonces/location`
  - `/annonces/{ville}`
  - `/annonces/{ville}/vente` / `/annonces/{ville}/location`
  - Filtres via query string (`?prixMin=…&prixMax=…&surfaceMin=…&pieces=…&sort=recent`)
- Fiche annonce canonique :
  - `/annonce/{slug}-{id}`  
  - **301** si slug incorrect vers le slug canonique.

## Page Home (résumé UX)

- Header : Logo, accès “Annonces”, CTA “Espace Pro” → `pro.atlasia.ma`
- Hero search : ville + transaction + budget max (option)
- Villes populaires, annonces récentes, section confiance
- Footer : Mentions/Confidentialité

Tracking minimal : `home_viewed`, `home_search_submitted`.

## Page Recherche / Listings

- Filtres MVP : transaction, ville, zone, prix min/max, surface min/max, pièces, tri.
- Cards résultat : photo, prix, titre, ville/zone, surface/pièces, badges trust.
- Carte : pins/clusters (optionnel MVP).
- Pagination : simple (page/size).

Tracking minimal : `search_viewed`, `search_performed`, `listing_card_clicked`, `map_pin_clicked`.

## Page Détail annonce

- Galerie images
- Prix + titre + badges trust
- Résumé : ville/zone, surface, pièces
- Description, caractéristiques, localisation
- Actions : WhatsApp (CTA), “Demander une visite” (form)
- “Signaler cette annonce”
- Annonces similaires (simple : même ville + tx + range prix)

Tracking minimal : `listing_viewed`, `whatsapp_clicked`, `lead_form_opened`, `similar_listing_clicked`.

## Formulaire Lead (Contact)

Champs MVP :
- Nom (obligatoire)
- Téléphone (obligatoire, normalisé E.164)
- Email (option)
- Message (option)
- Consentement contact (obligatoire)

API : `POST /api/public/v1/listings/{id}/leads`

## Signaler annonce

- Motif (select) : doublon, fraude, info incorrecte, autre
- Commentaire (option)

API : `POST /api/public/v1/listings/{id}/reports`

## SEO & performance (MVP)

- Meta title/description pour P1/P2
- Canonical sur P2
- `sitemap.xml` des annonces publiées
- Images responsive + lazy loading
- Cache HTTP sur endpoints GET publics (si possible)

## Definition of Done (Portail)

- Home + Search + Detail + Contact + Report en prod
- URLs stables + redirections slug
- Tracking minimal branché
- Règles d’exposition respectées (statuts + modération)
- Leads créés alimentent le CRM (tenant correct)
