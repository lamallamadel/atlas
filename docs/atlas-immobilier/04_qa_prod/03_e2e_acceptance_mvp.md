# E2E Acceptance Criteria — MVP (Portail + Biz + Pro)

> **Statut**: TO-BE (spécification tests)  
> **Source of truth**: Oui (acceptance criteria)

## A) Pro — Listings

### A1 — Créer annonce (Draft)
Given un utilisateur Pro authentifié  
When il crée une annonce minimale  
Then `status_code = ANN_DRAFT` et AuditEvent creation.

### A2 — Upload médias + primary
Given annonce `ANN_DRAFT`  
When upload 3 images + set primary  
Then médias visibles + thumbnail list + audit.

### A3 — Publish bloqué si qualité insuffisante
Given annonce incomplète  
When `ANN_T_PUBLISH`  
Then 400 `VALIDATION_ERROR` et statut inchangé.

### A4 — Publish OK → visible portail
Given annonce conforme  
When `ANN_T_PUBLISH`  
Then `ANN_PUBLISHED` + `/visibility publicWeb=true` + page publique 200.

### A5 — Suspend retire du portail
Given annonce publiée  
When `ANN_T_SUSPEND`  
Then portail 404 + sortie des résultats publics.

### A6 — Dedupe policy
Given duplicateScore >= threshold  
When agent publish  
Then refus ; si manager override puis publish → OK.

## B) Portail

### B1 — Search ne retourne que publiées
Given published/draft/suspended  
When public search  
Then seulement `ANN_PUBLISHED`.

### B2 — Slug canonical redirect
Given slug canonique  
When ancien slug  
Then 301 vers canonique + canonical tag.

### B3 — Lead creation
Given annonce publiée  
When submit contact with consent  
Then 201 + lead créé dans CRM (tenant correct).

### B4 — Consent obligatoire
When submit sans consent  
Then blocage UI + 400 `CONSENT_REQUIRED` si contournement.

### B5 — WhatsApp click tracking
When click WhatsApp  
Then event 204 puis redirection.

### B6 — Report
When report  
Then 201 + visible en Pro + compteur augmente.

## C) Biz → Pro (B2B)

### C1 — Demo form crée dossier B2B
When submit demo with consent  
Then dossier créé `CRM_LEAD_B2B_DEMO` en `B2B_NEW` visible en Pro.

## D) Pro — Pipeline B2B Demo

### D1 — Qualify
Given `B2B_NEW`  
When `B2B_T_QUALIFY` avec notes  
Then `B2B_QUALIFIED` + timeline.

### D2 — Schedule demo
Given `B2B_QUALIFIED`  
When `B2B_T_SCHEDULE` avec appointment  
Then `B2B_SCHEDULED` + RDV visible.

### D3 — Mark done
Given scheduled appointment DONE  
When `B2B_T_MARK_DONE`  
Then `B2B_DONE`.

### D4 — Win / Lose
Given `B2B_DONE`  
When `B2B_T_WIN` then terminal `B2B_WON`  
When `B2B_T_LOSE_*` avec raison obligatoire then terminal `B2B_LOST`.

## E) Non-fonctionnel

### E1 — Isolation multi-tenant
OrgA ne voit jamais OrgB sur cases/listings.

### E2 — JWT expiré
API pro → 401 (et UI redirige login).
