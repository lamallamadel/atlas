# API Public — Portail & Biz (MVP)

Ce document définit les contrats **publics** consommés par :
- Portail annonces : `atlasia.<tld>`
- Vitrine corporate : `biz.atlasia.<tld>`

> Les contrats **Pro** restent dans :
- `docs/atlas-immobilier/03_technique/12_api_pro_crm_b2b_demo.md`
- `docs/atlas-immobilier/03_technique/13_api_pro_listings.md`

---

## 1) Conventions

### Base paths
- Public : `/api/public/v1`
- Pro : `/api/v1` (réservé à `pro.atlasia.<tld>`)

### Headers
- Public : pas de `X-Org-Id` requis (déterminé par la ressource ou policy).
- Pro : multi-tenant via `X-Org-Id` / claims JWT (voir doc sécurité).

### Erreurs (format)
```json
{ "code": "ERROR_CODE", "message": "…", "details": {} }
```

### Pagination
- `page`, `size` + réponse `{ page, size, total, items }`

---

## 2) Portail annonces — Listings (read)

### 2.1 Recherche annonces
**GET** `/api/public/v1/listings`

Query params MVP :
- `q` (texte)
- `tx` (`SALE|RENT` ou code équivalent)
- `city`, `zone`
- `price_min`, `price_max`
- `rooms_min`, `surface_min`
- `page`, `size`, `sort`

Réponse item (MVP) :
```json
{
  "listingId": "8f3a2c",
  "slug": "appartement-2-chambres-centre-tanger",
  "tx": "RENT",
  "title": "Appartement 2 chambres - Centre",
  "price": 6000,
  "currency": "MAD",
  "city": "Tanger",
  "zone": "Centre",
  "surfaceM2": 85,
  "rooms": 2,
  "thumbnailUrl": "/media/8f3a2c/primary.jpg"
}
```

Règle : le public ne voit que les annonces **publiées**.

---

### 2.2 Détail annonce
**GET** `/api/public/v1/listings/{listingId}`

Réponse :
```json
{
  "listingId": "8f3a2c",
  "slug": "appartement-2-chambres-centre-tanger",
  "tx": "RENT",
  "title": "…",
  "description": "…",
  "price": 6000,
  "currency": "MAD",
  "city": "Tanger",
  "zone": "Centre",
  "surfaceM2": 85,
  "rooms": 2,
  "bathrooms": 1,
  "geo": { "lat": 35.78, "lng": -5.81 },
  "amenities": ["ELEVATOR","PARKING"],
  "media": [
    { "url": "/media/8f3a2c/1.jpg", "isPrimary": true }
  ],
  "publishedAt": "2026-01-10T11:00:00Z"
}
```

Règles :
- 404 si non publié/suspendu/archivé.
- Canonical géré côté front par slug+id.

---

## 3) Portail annonces — Leads (create)

### 3.1 Créer un lead depuis une annonce
**POST** `/api/public/v1/listings/{listingId}/leads`

Body (MVP) :
```json
{
  "fullName": "…",
  "phone": "…",
  "email": "…",
  "message": "…",
  "consentContact": true,
  "contactChannelPreferred": "WHATSAPP"
}
```

Réponse :
- `201 Created` + `{ "leadId": "L-1", "caseId": "C-1" }`

Règles :
- Consentement obligatoire (`consentContact=true`) sinon `400 CONSENT_REQUIRED`.
- Le backend crée un dossier/lead côté Pro selon la policy (B2C ou lead simple).

---

## 4) Portail annonces — Reports (create)

### 4.1 Signaler une annonce
**POST** `/api/public/v1/listings/{listingId}/reports`

Body :
```json
{
  "reasonCode": "REPORT_FRAUD",
  "comment": "…",
  "reporterContact": { "phone": "…", "email": "…" }
}
```

Réponse : `201 Created` + `{ "reportId": "R-1" }`

Règles :
- `reasonCode` doit être dans le référentiel (MVP).
- `reporterContact` optionnel (policy).

---

## 5) Portail annonces — Events (tracking minimal)

### 5.1 Enregistrer un event (ex: click WhatsApp)
**POST** `/api/public/v1/listings/{listingId}/events`

Body :
```json
{ "eventType": "WHATSAPP_CLICKED", "meta": { "source": "detail_page" } }
```

Réponse : `204 No Content`

---

## 6) Biz — Démo (create)

### 6.1 Soumettre demande de démo
**POST** `/api/public/v1/biz/demo-leads`

Body :
```json
{
  "fullName": "…",
  "email": "…",
  "phone": "…",
  "company": "…",
  "actorType": "AGENCY",
  "city": "Tanger",
  "teamSizeBucket": "2_5",
  "listingVolumeBucket": "50_200",
  "needs": ["NEED_CRM","NEED_WHATSAPP"],
  "desiredPlanKey": "PLAN_PRO_GROWTH",
  "message": "…",
  "consentContact": true,
  "utm": { "utm_source": "google", "utm_campaign": "biz_launch_mvp" }
}
```

Réponse : `201 Created` + `{ "caseId": "C-123" }`

Règles (alignement CRM) :
- `case_type_code = CASE_TYPE_LEAD_B2B_DEMO`
- `status_code = B2B_NEW`
- `source_code = LEAD_SOURCE_BIZ_DEMO_FORM`

---

## 7) Sécurité & rate limiting (MVP)
- Public endpoints : rate limiting (par IP, par route sensible).
- Protection anti-spam : captcha (V1) ou heuristique simple (MVP).
