# Prod readiness checklist (MVP market-ready)

> **Statut**: TO-BE (gating release)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/UAT_SCENARIOS.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`

Cette checklist définit les critères minimaux pour déclarer le MVP “market-ready”.

## 1) Sécurité / conformité
- JWT validé, endpoints sensibles protégés
- Isolation tenant vérifiée (tests)
- Consentement **bloquant** sur outbound WhatsApp/SMS/Email
- Secrets (webhooks/providers) stockés hors code (env/secret manager)

## 2) Fonctionnel (P0)
- Dossier : création, update, transitions + historique
- Timeline : notes + événements automatiques
- Messages : journalisation inbound/outbound + rattachement dossier
- RDV : CRUD + affichage dossier
- Audit : consultable et filtrable

## 3) WhatsApp (Choix B)
- Inbound webhook : signature + idempotence + association dossier
- Outbound : provider réel + templates + envoi asynchrone
- Outbox + retry/backoff + DLQ
- Callbacks status : signature + dédoublonnage + update statuts

## 4) Qualité
- BE : tests unit + intégration “green”
- FE : tests unit “green”
- E2E : 5 scénarios P0 **non flakys** (3 runs consécutifs)
- Erreurs API normalisées (messages exploitables)

## 5) Observabilité / exploitation
- Correlation-id bout en bout (API + worker)
- Logs : erreurs provider sanitisées
- Métriques outbound : queue size, latency, failure rate
- Alertes : DLQ > 0, failure rate > seuil

## 6) Documentation minimum
- Onboarding (créer org, user, seed)
- Runbook incident (webhook down, provider down, DLQ)
