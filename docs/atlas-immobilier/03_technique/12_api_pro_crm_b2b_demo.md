# API Pro — CRM (B2B Demo) — Contrat (v1)

> **Domaine**: `pro.atlasia.ma`  
> **Scope**: dossiers `CRM_LEAD_B2B_DEMO`

## Base & conventions
- Base URL: `https://pro.atlasia.ma/api/v1`
- Auth JWT Bearer, tenant via `X-Org-Id`
- Erreurs JSON: `{code,message,details}`

## Lister dossiers B2B
`GET /cases?case_type_code=CRM_LEAD_B2B_DEMO&page=1&size=20&status_code=B2B_NEW`

Réponse: `{page,size,total,items[]}`

## Détail dossier
`GET /cases/{caseId}`  
Inclut contact, qualification, appointments, timeline.

## Créer dossier (usage interne / import)
`POST /cases` avec `caseTypeCode=CRM_LEAD_B2B_DEMO` + contact + payload + consent.

## Réassigner
`POST /cases/{caseId}/assign {assigneeUserId}` (manager/admin)

## Mettre à jour qualification
`PATCH /cases/{caseId}/qualification {notes,score,needs,desiredPlanKey}`

## Transitions
- `GET /cases/{caseId}/transitions` → liste actions autorisées
- `POST /cases/{caseId}/transitions` avec `transitionCode` + payload (appointment / lostReasonCode)

## Appointments (minimal)
- `POST /cases/{caseId}/appointments`
- `PATCH /appointments/{appointmentId}`
- `POST /appointments/{appointmentId}/status {status}`

## Reporting minimal
`GET /reports/b2b-demo/summary?from=…&to=…`

## Codes erreurs
- `CASE_NOT_FOUND` (404)
- `TRANSITION_NOT_ALLOWED` (409)
- `VALIDATION_ERROR` (400)
- `FORBIDDEN` (403)
