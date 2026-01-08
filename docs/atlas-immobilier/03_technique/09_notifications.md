# Notifications & Outbound (WhatsApp / SMS / Email) — Choix B (market-ready)

> **Statut**: TO-BE (cible market-ready)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour l’architecture outbound)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/02_regles_metier.md`  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `WHATSAPP_INTEGRATION.md` (racine repo)
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Objectif

Mettre en place un système **réel** d’envoi de notifications/messages (en priorité WhatsApp), avec :
- conformité (consentement strict)
- résilience (outbox, retry, idempotence)
- traçabilité (audit + timeline)
- observabilité (métriques, monitoring, alerting)

## Nomenclature des événements Outbox

Les **types d’événements** émis vers l’outbox sont des codes techniques distincts des référentiels métier.
Convention : préfixe `EVT_` (ex: `EVT_COOP_CALL_FOR_FUNDS`).
Ne pas confondre avec les codes de référentiels (ex: `COOP_GROUP_FUNDING_OPEN`).

Ce document décrit l’architecture et les contrats attendus pour attaquer le marché.

## Périmètre (Choix B)

### Inclus
- WhatsApp outbound **provider réel**
- Templates WhatsApp + règles “session”
- Outbox pattern + worker d’envoi
- Retry/backoff + DLQ (dead-letter)
- Callbacks / webhooks provider (delivery, failed) + mise à jour statuts
- Monitoring / métriques

### Optionnel (même architecture, providers ultérieurs)
- SMS provider
- Email provider

---

# 1) Règles produit (bloquantes)

## 1.1 Consentement strict (deny by default)
- Tout message OUTBOUND vers `WHATSAPP/SMS/EMAIL` nécessite un consentement **GRANTED** (par canal).
- En cas de refus :
  - l’API répond 4xx (ex : 409/422) avec un message explicite
  - un audit event “BLOCKED_BY_POLICY” est enregistré (recommandé)

Référence : `docs/atlas-immobilier/02_fonctionnel/02_regles_metier.md`

## 1.2 Traçabilité
Chaque envoi doit produire :
- audit event (création demande, envoi, succès/échec)
- activity dans la timeline (MESSAGE_LOG + statut d’envoi)

---

# 2) Architecture recommandée (Outbox + Worker)

## 2.1 Pourquoi outbox
Éviter les problèmes classiques :
- appel provider lent/instable dans une transaction API
- perte d’événements en cas de crash
- impossibilité de rejouer proprement

## 2.2 Composants

### API Backend (synchrones)
- Valide : auth + tenant + consentement + payload
- Persist : `OutboundMessage` (statut = QUEUED)
- Publie en outbox : `OutboundJob` (ou table unique avec état)

### Worker Outbound (asynchrone)
- Poll/consume les jobs
- Envoie au provider
- Met à jour statuts + tentatives
- Applique retry/backoff

### Provider callbacks (webhooks)
- Réceptionne delivery status (SENT/DELIVERED/FAILED)
- Vérifie signature
- Met à jour `OutboundMessage`
- Ajoute audit + activity si nécessaire

---

# 3) Modèle de données (minimum viable)

## 3.1 OutboundMessage
Champs recommandés :
- `id`
- `org_id`
- `dossier_id`
- `channel` (WHATSAPP, SMS, EMAIL)
- `direction` = OUTBOUND
- `to` (phone/email)
- `template_code` (WhatsApp) ou `subject` (email)
- `payload_json` (variables template, contenu, meta)
- `status` : QUEUED | SENDING | SENT | DELIVERED | FAILED | CANCELLED
- `provider_message_id` (si connu)
- `idempotency_key` (clé client, unique par org)
- `created_at`, `updated_at`

## 3.2 OutboundAttempt
- `id`
- `outbound_message_id`
- `attempt_no`
- `status` : TRYING | FAILED | SUCCESS
- `error_code`, `error_message` (sanitisé)
- `provider_response_json` (optionnel)
- `next_retry_at`
- `created_at`

## 3.3 Template (WhatsApp)
- `template_code`
- `language`
- `category`
- `variables_schema_json`
- `is_active`

---

# 4) Idempotence & retry policy

## 4.1 Idempotence (API)
- Le client fournit `Idempotency-Key` lors de `POST /outbound/messages`
- Backend assure unicité `(org_id, idempotency_key)`
- Si la même clé est rejouée : retourner le même `OutboundMessage` (sans dupliquer)

## 4.2 Retry (worker)
- Max attempts : ex 5
- Backoff exponentiel : ex 1m, 5m, 15m, 1h, 6h
- Erreurs non-retryables : 4xx provider (payload invalide, template inconnu)
- DLQ : après max attempts → status FAILED + reason

## 4.3 Dédoublonnage provider
- Stocker `provider_message_id`
- En callback, utiliser `provider_message_id` pour lier et ignorer les doublons

---

# 5) WhatsApp specifics (à respecter)

**Référence détaillée existante** : `WHATSAPP_INTEGRATION.md` (racine repo)

Points produit à intégrer dans l’implémentation :
- Distinction template vs session message (fenêtre 24h selon règles WhatsApp)
- Gestion des templates et variables
- Gestion des numéros (E.164), normalisation
- Gestion des erreurs provider (rate limit, forbidden, invalid recipient)
- Tracking statuts delivery (selon ce que le provider expose)

---

# 6) Endpoints (contrats)

Voir également : `docs/atlas-immobilier/03_technique/03_api_contracts.md`

## 6.1 API Outbound
- `POST /api/v1/outbound/messages`  
  Crée une demande d’envoi (persist + outbox). Retourne `{id, status}`.

- `GET /api/v1/outbound/messages/{id}`  
  Retourne détails + statut + tentatives.

- `GET /api/v1/outbound/messages?dossierId=`  
  Listing par dossier.

- `POST /api/v1/outbound/messages/{id}/retry` (ops/admin)  
  Force un retry (si FAILED).

## 6.2 Webhooks provider
- `POST /api/v1/webhooks/whatsapp/status` (si séparé du inbound)  
  Met à jour delivery status (signature obligatoire).

---

# 7) Observabilité (market-ready)

## 7.1 Logs
- Corrélation : correlation-id par requête + par job worker
- Log des erreurs provider (sanitisé)

## 7.2 Métriques (minimum)
- queue size
- send latency (queued → sent)
- delivery latency (sent → delivered)
- failure rate + top error codes
- retry count + DLQ count

## 7.3 Alerting
- DLQ > 0
- failure rate > seuil
- webhook signature failures

---

# 8) Definition of Done (Outbound B)

- Consentement strict bloquant en API
- Outbox + worker opérationnels
- Retry/backoff + DLQ
- Idempotence (API + callbacks)
- Audit + timeline pour chaque étape
- Monitoring métriques + dashboards de base
- Tests :
  - unit (policy/validation)
  - integration (DB outbox + worker)
  - E2E (parcours dossier + envoi WhatsApp)

---

## 6) Cas d’usage — Coop Habitat (TO-BE)

> Source of truth : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.

### 6.1 Templates WhatsApp (exemples)
- `EVT_COOP_CALL_FOR_FUNDS` : appel de fonds (montant, échéance, référence plan/version)
- `EVT_COOP_PAYMENT_REMINDER` : rappel J-3/J-1
- `EVT_COOP_PAYMENT_LATE` : retard + pénalité
- `EVT_COOP_PV_PUBLISHED` : PV / décision publiée
- `EVT_COOP_ALLOCATION_PROPOSED` : proposition d’allocation (rang, lot, délai contestation)
- `EVT_COOP_ALLOCATION_ASSIGNED` : allocation attribuée
- `EVT_COOP_PROJECT_MILESTONE` : jalon projet (PERMITS/BUILDING/DELIVERY/HANDOVER)
- `EVT_COOP_STATUS_CHANGE` : changement de statut group/projet

### 6.2 Règles d’envoi (politiques)
- Consentement WHATSAPP requis (`GRANTED`) — deny by default.
- Idempotence : clé `(org_id, template_code, entity_type, entity_id, logical_event_id)`.
- Scheduling : rappels J-3/J-1, relances J+1/J+7 (selon gouvernance).
- Transparence : le message référence le plan/version (plan_id + version).

### 6.3 Outbox events (exemples)
- `EVT_COOP_CONTRIBUTION_DUE_CREATED`
- `EVT_COOP_CONTRIBUTION_OVERDUE`
- `EVT_COOP_ALLOCATION_VALIDATED`
- `EVT_COOP_PROJECT_MILESTONE_UPDATED`
- `EVT_COOP_DOCUMENT_PUBLISHED`

Chaque event :
- crée une entrée outbox,
- est envoyé par le worker,
- produit un `MESSAGE_LOG` (timeline) + audit “NOTIFICATION_SENT/FAILED”.