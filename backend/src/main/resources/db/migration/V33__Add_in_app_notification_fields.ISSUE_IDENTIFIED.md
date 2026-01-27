# Issue Identified: V33__Add_in_app_notification_fields.sql

## Problem

The current V33 migration attempts to use PostgreSQL-specific **partial index** syntax in the H2-compatible base migration folder:

```sql
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at) 
  WHERE type = 'IN_APP' AND read_at IS NULL;
```

## Why This Is a Problem

1. **H2 does not support partial indexes** - The `WHERE` clause in `CREATE INDEX` is a PostgreSQL extension
2. **Potential migration failure** - This may cause the migration to fail when run on H2
3. **Inconsistent behavior** - If H2 silently ignores the WHERE clause, the index behavior differs between environments

## Impact

- **H2 environments** (development, testing): May fail or create incorrect index
- **PostgreSQL environments**: Works correctly (but should use V107 in migration-postgres/ folder)

## Solution

The H2 version should use a standard index without the WHERE clause:

### Current (Incorrect for H2):
```sql
-- backend/src/main/resources/db/migration/V33__Add_in_app_notification_fields.sql
ALTER TABLE notification ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at) 
  WHERE type = 'IN_APP' AND read_at IS NULL;  -- ❌ H2 does not support WHERE clause
```

### Recommended Fix:
```sql
-- backend/src/main/resources/db/migration/V33__Add_in_app_notification_fields.sql
ALTER TABLE notification ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);

-- Standard index for H2 compatibility (no WHERE clause)
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at);  -- ✅ H2 compatible
```

## Database-Specific Optimization

The PostgreSQL-optimized version with partial index already exists and is correctly placed:

```sql
-- backend/src/main/resources/db/migration-postgres/V107__Add_in_app_notification_fields.sql
-- (already correct)
ALTER TABLE notification ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);

-- Partial index for PostgreSQL (optimized for unread notifications)
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at) 
  WHERE type = 'IN_APP' AND read_at IS NULL;  -- ✅ PostgreSQL-specific optimization
```

## Action Required

Update `backend/src/main/resources/db/migration/V33__Add_in_app_notification_fields.sql` to remove the WHERE clause from the index definition, ensuring H2 compatibility while maintaining the optimized partial index in the PostgreSQL-specific version.

## Testing

After fix, verify:
1. ✅ H2 migration runs without errors
2. ✅ PostgreSQL migration uses partial index (V107)
3. ✅ Both databases have functional indexes for notification queries
4. ✅ Query performance is acceptable in both environments
