# Site vitrine corporate — Spécification UI (MVP)

> Voir aussi : `docs/atlas-immobilier/02_fonctionnel/11_biz_seo_tracking.md`

> **Domaine**: `biz.atlasia.ma`  
> **Statut**: TO-BE (cible MVP)  
> **Source of truth**: Oui (pour le site vitrine B2B)  

## Objectifs

1. Expliquer Atlasia aux **pros** (agences, promoteurs, bailleurs pro).
2. Convertir via **demande de démo** (lead B2B).
3. Qualifier rapidement (type, ville, taille, besoins) pour alimenter le CRM.
4. Séparation nette : **Lead B2B ≠ Lead B2C**.

## Pages MVP

- Landing : `/`
- Agences : `/agences`
- Promoteurs : `/promoteurs`
- Tarifs : `/tarifs`
- Démo : `/demo`
- Contact : `/contact`
- Mentions / Confidentialité

## Header / Footer

- CTA primaire : **Demander une démo** (→ `/demo`)
- CTA secondaire : **Espace Pro** (→ `pro.atlasia.ma`)
- Lien “Portail annonces” (→ `atlasia.ma`)

## /tarifs (wireframe)

- Hero : plans simples
- 3 cartes : `PLAN_PRO_STARTER`, `PLAN_PRO_GROWTH`, `PLAN_PROMOTER`
- Add-ons (teaser) : boost/verified/reporting/export/integrations
- FAQ
- CTA “Demander une démo” avec préselection `?plan=…`

Tracking : `biz_pricing_viewed`, `biz_pricing_plan_selected`, `biz_pricing_cta_clicked`.

## /demo (wireframe)

Formulaire (MVP) :
- Nom* ; Email* ; Téléphone* ; Consentement contact*
- Type d’acteur* : Agence / Promoteur / Bailleur pro / Autre
- Ville principale*
- Taille équipe (bucket)
- Volume annonces (bucket)
- Besoins (multi) : portail, CRM, RDV, trust, neuf, location, financement…
- Commentaire (option)
- Plan souhaité (si `?plan=`)

Tracking : `biz_demo_viewed`, `biz_demo_submitted`, `biz_demo_failed`, `biz_demo_success_shown`.

## Intégration CRM (B2B)

À la soumission de `/demo` :
- Créer un dossier avec `case_type_code = CRM_LEAD_B2B_DEMO`
- Statut initial : `B2B_NEW`
- Source : `LEAD_SOURCE_BIZ_DEMO_FORM`
- Payload JSON : actorType, city, teamSize, listingVolume, needs[], desiredPlanKey, message
- Consentement contact obligatoire

## Definition of Done (Biz)

- Landing + Agences + Promoteurs + Tarifs + Démo fonctionnels
- Formulaire démo crée un dossier B2B dans le CRM
- Tracking minimal
- SEO de base (pages statiques indexables)
