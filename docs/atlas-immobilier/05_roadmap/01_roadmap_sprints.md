# Roadmap (proposition) — MVP+ vers CRM complet

> **Statut**: Stable  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PROJECT_DOCUMENTATION_INDEX.md`

## État d’avancement (référence)
- **Week 1** : foundations monorepo + infra PostgreSQL
- **Week 2** : CRUD Annonces/Dossiers + Dashboard + stabilisation UI
- **Week 3** : **sécurité + multi-tenancy** (Keycloak + JWT + `X-Org-Id` + filtre Hibernate) + tests cross-tenant

Les sprints ci-dessous décrivent la suite logique (Advanced CRM).

## Sprint A — Foundations (sécurité + multi-tenancy)
- ✅ Terminé en Week 3
- `TenantContext` + `TenantFilter` (header `X-Org-Id`)
- Filtrage row-level via Hibernate `@Filter` (orgIdFilter)
- `@PreAuthorize` sur endpoints métiers (roles `ADMIN`/`PRO`)
- Tests d’isolation cross-tenant

## Sprint B — Workflow Dossier
- DossierWorkflowService (transitions + guards)
- Endpoint transitions
- UI : dropdown transitions autorisées
- Tests transitions

## Sprint C — Consentements
- ConsentementService + endpoints
- UI : checkboxes/badges
- Enforcement : blocage messages sortants
- Tests consentements

## Sprint D — Messagerie / Timeline
- MessageEntity + endpoints
- UI timeline + filtres
- Activité dans détail dossier
- Tests FE + E2E

## Sprint E — Audit trail
- Entity listeners + AuditEventEntity
- Endpoints audit read-only
- UI audit trail
- Tests audit

## Sprint F — Reporting & Notifications
- Full-text + dashboard KPIs
- Page reporting (charts)
- NotificationService + templates + async
- Observabilité + monitoring endpoints

## Piste produit (TO-BE) — Sprint(s) “Coop Habitat”

### Sprint C1 — Bounded context Coop (structure)
- Entités : Group, Member, Project, Lot, ContributionPlan, Contribution (ledger), Allocation, Documents
- Workflows group/projet/allocation
- Audit + timeline auto

### Sprint C2 — Outbound WhatsApp pour Coop
- Templates + scheduling (appel de fonds, rappels, allocations, jalons)
- Outbox events + monitoring

### Sprint C3 — Gouvernance (PV/decisions) + litiges
- Publication PV, contestation allocation, exclusion/remplacement membre (règles)
