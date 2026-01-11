# Biz — SEO & Tracking (MVP)

Ce document formalise les règles SEO et le plan de tracking UX pour la vitrine **`biz.atlasia.<tld>`**.
Il complète la spécification fonctionnelle de la vitrine :  
- `docs/atlas-immobilier/02_fonctionnel/07_site_vitrine_biz_mvp.md`

---

## Conventions SEO

### Domaine & canonical
- Domaine principal : `https://biz.atlasia.<tld>`
- Canonical systématique sur `biz.atlasia.<tld>` (pas de duplication via paramètres).
- Option : si `www.biz...` existe, 301 vers `biz...`.

### Indexation
- Pages indexables (MVP) : `/`, `/agences`, `/promoteurs`, `/tarifs`, `/demo`
- Pages légales : indexables, faible priorité.

### Internationalisation
- MVP : FR (par défaut).
- Extension future (non MVP) : `hreflang` pour `fr-MA` et `ar-MA`.

---

## Métadonnées par page (Title / Description / OpenGraph)

> Ligne éditoriale : **premium mais proche du terrain** (conversion démo).

### Landing `/`
- **Title** : `Atlasia Pro | Portail + CRM immobilier pour agences & promoteurs`
- **Description** : `Centralisez vos leads, publiez vos annonces, planifiez vos visites et suivez vos performances. Atlasia Pro combine portail + CRM avec une approche WhatsApp-first et anti-doublons.`
- **OG** :
  - `og:type=website`
  - `og:url=https://biz.atlasia.<tld>/`
  - `og:image=https://biz.atlasia.<tld>/assets/og/atlasia-pro.png` (placeholder)

### Agences `/agences`
- **Title** : `CRM immobilier pour agences | Leads → visites → closing | Atlasia Pro`
- **Description** : `Attribuez vos leads, suivez votre pipeline, planifiez des visites et améliorez vos conversions. Conçu pour le rythme réel des agences, WhatsApp inclus.`
- **OG url** : `https://biz.atlasia.<tld>/agences`

### Promoteurs `/promoteurs`
- **Title** : `Solution promoteurs & programmes neufs | Prospects & RDV | Atlasia Pro`
- **Description** : `Suivez les prospects, organisez les rendez-vous et pilotez votre performance. Atlasia Pro structure le flux de demandes et simplifie le suivi commercial.`
- **OG url** : `https://biz.atlasia.<tld>/promoteurs`

### Tarifs `/tarifs`
- **Title** : `Tarifs Atlasia Pro | Plans agences & promoteurs`
- **Description** : `Des plans simples selon votre taille. Activez les modules utiles (portail, CRM, RDV, Trust, reporting). Demandez une démo pour une recommandation adaptée.`
- **OG url** : `https://biz.atlasia.<tld>/tarifs`

### Démo `/demo`
- **Title** : `Demander une démo | Atlasia Pro`
- **Description** : `Laissez vos coordonnées et votre besoin principal. Nous vous recontactons sous 24–48h pour une démo concrète adaptée à votre ville et à votre équipe.`
- **OG url** : `https://biz.atlasia.<tld>/demo`

---

## Sitemap & Robots (MVP)

### sitemap.xml
Inclure uniquement les pages statiques vitrine :
- `/`
- `/agences`
- `/promoteurs`
- `/tarifs`
- `/demo`
- `/mentions-legales`
- `/confidentialite`

### robots.txt
- Autoriser l’indexation des pages vitrine.
- Bloquer les routes techniques si nécessaire (ex : `/api/`).
- Référencer `sitemap.xml`.

---

## Tracking — événements `biz_*` (MVP)

### Principes
- Ne pas envoyer de PII en analytics (pas d’email/téléphone).
- Le backend (création du dossier B2B) reste la **source de vérité business**.
- La vitrine émet les événements UX (views/clicks/submits) uniquement.

### Convention payload
Champs communs recommandés :
- `page` (path)
- `source_section` (hero|nav|pricing|faq|footer)
- `utm` (si présent)
- `plan` (si param `?plan=...`)

### Événements
**Vues**
- `biz_landing_viewed`
- `biz_agencies_viewed`
- `biz_developers_viewed`
- `biz_pricing_viewed`
- `biz_demo_viewed`

**Clicks**
- `biz_cta_demo_clicked` (inclure `source_section`)
- `biz_pricing_plan_selected` (inclure `plan`)

**Submits**
- `biz_demo_submitted` (sans PII) :
  - `actorType`, `city` (ou `city_code`), `teamSize_bucket`, `listingVolume_bucket`
  - `needs_count`, `plan`
- `biz_demo_failed` : `error_code`, `field`

---

## Conventions UTM (acquisition)
UTM recommandés :
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

Règle :
- Conserver les UTMs en session (frontend) et les envoyer dans le payload de la demande démo (backend),
  sans données sensibles.

---

## Alignement CRM (rappel)
À la soumission `/demo`, création d’un dossier :
- `case_type_code = CASE_TYPE_LEAD_B2B_DEMO`
- `status_code = B2B_NEW`
- `source_code = LEAD_SOURCE_BIZ_DEMO_FORM`
- `payload` : `actorType/city/teamSize/listingVolume/needs/desiredPlanKey/message/utm`
