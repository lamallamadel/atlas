# Backlog — Exécution MVP (Portail + Biz + Pro)

> Objectif : transformer la doc en backlog exécutable (Epics/Stories), avec priorité.

## P0 — Publication annonces (Pro → Portail)
1. CRUD listing (draft) + validations (server)
2. Médias (upload, ordre, primary)
3. Workflow listing (publish/suspend/archive) via `allowedTransitions`
4. Public read (search + detail) filtré `ANN_PUBLISHED`
5. Lead depuis annonce (consent obligatoire)
6. Reports (public create + pro view + close) + suspension

Docs : UI Listings + API Pro Listings + API Public.

---

## P0 — Biz Démo → CRM B2B pipeline
1. Page `/demo` + mapping payload (actor/city/needs/plan/utm)
2. Endpoint public `/biz/demo-leads` crée `CASE_TYPE_LEAD_B2B_DEMO` en `B2B_NEW`
3. Pro Kanban B2B : colonnes par `B2B_*`
4. Transitions B2B (QUALIFY/SCHEDULE/RESCHEDULE/DONE/WIN/LOSE)
5. RDV (appointment) + timeline

Docs : Workflow B2B + UI Pro B2B Demo + API Pro + API Public.

---

## P1 — Vitrine Biz (conversion)
1. Pages vitrine (Landing, Agences, Promoteurs, Tarifs)
2. SEO (meta, OG, sitemap, robots)
3. Tracking events `biz_*` (sans PII)

---

## P1 — Sécurité & isolations
1. Auth Pro + RBAC minimal (AGENT/MANAGER/ADMIN_ORG)
2. Multi-tenant strict (org_id filters)
3. JWT expiré → UI session expired

---

## P2 — Qualité & Trust (hardening)
1. quality_score + missing[] calcul
2. duplicate_score + policy publish + override manager
3. Rate limiting + anti-spam (public forms)

---

## Definition of Done (global)
- Scénarios E2E “MVP Acceptance” satisfaits : `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md`
- Monitoring minimal + audit events sur actions sensibles.
