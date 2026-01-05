# Audit logging — design détaillé

## Objectif
Capturer automatiquement les opérations CREATE/UPDATE/DELETE sur les entités métiers (Annonce, Dossier, Message, Consentement, etc.).

## Approche recommandée
- `@EntityListeners(AuditEntityListener.class)`
- callbacks :
  - `@PostPersist` → CREATE (after_json)
  - `@PostUpdate` → UPDATE (before/after/diff)
  - `@PreRemove` ou `@PostRemove` → DELETE (before_json)

## Diffs JSON
Options :
- Simple : stocker `before_json` et `after_json` (diff calculé à l’affichage).
- Optimisé : stocker `diff_json` calculé au moment de l’événement.

Recommandation : `jsonb` PostgreSQL + diff JSON (RFC6902 / jsonpatch) si besoin.

## Contraintes techniques
- Gérer les relations lazy : sérialiser un “snapshot” contrôlé (DTO audit) plutôt que l’entité JPA brute.
- Injecter contexte request : acteur (`createdBy`), correlation id, tenant id.
- Écrire l’audit dans la **même transaction** pour cohérence (ou outbox si async).

## API
Audit en lecture seule, filtré tenant.

