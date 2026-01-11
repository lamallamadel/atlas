# Référentiel — Freeze MVP (codes & transitions)

> Objectif : figer le sous-ensemble **MVP** des codes (types/statuts/transitions) afin de stabiliser API + DB + UI.
> La définition exhaustive reste dans :
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

---

## 1) Dossiers CRM — B2B Demo

### Case Type
- `CASE_TYPE_LEAD_B2B_DEMO`

### Status codes (MVP)
- `B2B_NEW`
- `B2B_QUALIFIED`
- `B2B_SCHEDULED`
- `B2B_DONE`
- `B2B_WON` (terminal)
- `B2B_LOST` (terminal)

### Transition codes (MVP)
- `B2B_T_QUALIFY` : NEW → QUALIFIED (require: `qualification.notes`)
- `B2B_T_SCHEDULE` : QUALIFIED → SCHEDULED (require: `appointment`)
- `B2B_T_RESCHEDULE` : SCHEDULED → SCHEDULED (require: `appointment.startsAt`)
- `B2B_T_MARK_DONE` : SCHEDULED → DONE (require: `appointment.status=DONE`)
- `B2B_T_WIN` : DONE → WON
- `B2B_T_LOSE` : {NEW|QUALIFIED|SCHEDULED|DONE} → LOST (require: `lostReasonCode`)

### Lost reasons (MVP)
- `B2B_LOST_NO_BUDGET`
- `B2B_LOST_NOT_READY`
- `B2B_LOST_COMPETITOR`
- `B2B_LOST_NO_RESPONSE`
- `B2B_LOST_OTHER`

### Lead sources (Biz)
- `LEAD_SOURCE_BIZ_DEMO_FORM`

---

## 2) Annonces — Publications / Listings

### Status codes (MVP)
- `ANN_DRAFT`
- `ANN_PUBLISHED`
- `ANN_SUSPENDED`
- `ANN_ARCHIVED`

### Transition codes (MVP)
- `ANN_T_PUBLISH` : DRAFT → PUBLISHED (requires: min photos + quality ok + trust policy ok)
- `ANN_T_SUSPEND` : PUBLISHED → SUSPENDED (requires: reasonCode)
- `ANN_T_ARCHIVE` : {DRAFT|PUBLISHED|SUSPENDED} → ARCHIVED

### Publication channel (MVP)
- `PUBLIC_WEB`

### Modération (reasons) — MVP
- `MOD_SUSPECT_FRAUD`
- `MOD_ILLEGAL_CONTENT`
- `MOD_DUPLICATE_LISTING`
- `MOD_OTHER`

---

## 3) Signalements (Reports)

### Reason codes (MVP)
- `REPORT_FRAUD`
- `REPORT_INCORRECT_INFO`
- `REPORT_DUPLICATE`
- `REPORT_SPAM`
- `REPORT_OTHER`

### Status codes (MVP)
- `REPORT_OPEN`
- `REPORT_CLOSED`

---

## 4) Besoins (B2B) & Plans

### Needs (MVP)
- `NEED_CRM`
- `NEED_PORTAL`
- `NEED_TRUST`
- `NEED_REPORTING`
- `NEED_WHATSAPP`

### Plans (MVP)
- `PLAN_PRO_STARTER`
- `PLAN_PRO_GROWTH`
- `PLAN_PROMOTER`

---

## 5) Règles de compatibilité
- Les UIs utilisent `GET .../transitions` comme source de vérité pour actions.
- Les APIs valident strictement les champs requis par transition.
- Les labels (affichage) sont gérés côté UI (i18n) ou via un endpoint référentiel (option).
