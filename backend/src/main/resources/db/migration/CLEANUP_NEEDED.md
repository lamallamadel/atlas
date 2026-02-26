# Migration Cleanup Required

## Issue
During implementation, duplicate migration files were created with version 139. These need to be manually deleted.

## Files to DELETE
The following files in `backend/src/main/resources/db/migration/` should be manually deleted:
1. `V139__Add_locale_to_dossier.sql` 
2. `V139__Add_locale_to_dossier_DELETE_ME.sql`
3. `V140__Add_locale_to_dossier.sql`

## Files to KEEP
- `V139__Add_whatsapp_quota_tier_and_cost_tracking.sql` (correct - original quota tracking)
- `V141__Add_locale_to_dossier.sql` (correct - locale migration)

## Why
Flyway requires unique version numbers. The locale migration has been properly implemented as V141.
