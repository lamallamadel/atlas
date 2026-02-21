# PostgreSQL-Specific Migrations Validation Report (V100-V107)

## Executive Summary

All migrations V100-V107 in the `db/migration-postgres` folder have been validated as **PostgreSQL-specific**. None of these migrations should be moved to the base migration folder, as they all use PostgreSQL-exclusive features that are not compatible with H2.

---

## Migration Analysis

### ✅ V100__Add_postgres_full_text_indexes.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **GIN indexes** - `USING gin`
   - Full-text search index type not available in H2
   - H2 has its own full-text search via `FULLTEXT` index, but syntax is incompatible
   
2. **`to_tsvector()` function**
   - PostgreSQL-specific full-text search function
   - Converts text to tsvector type for efficient text search
   - No H2 equivalent

**Example:**
```sql
CREATE INDEX IF NOT EXISTS idx_annonce_title_fts
  ON annonce USING gin (to_tsvector('simple', COALESCE(title, '')));
```

**Verdict:** Must remain in `migration-postgres/`. H2 cannot execute GIN indexes or to_tsvector functions.

---

### ✅ V101__Add_outbound_partial_indexes.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **Partial indexes with WHERE clause**
   - PostgreSQL extension to standard SQL
   - H2 does not support partial indexes (indexes with WHERE predicates)

**Examples:**
```sql
CREATE INDEX idx_outbound_message_queued 
  ON outbound_message(status, attempt_count) 
  WHERE status = 'QUEUED';

CREATE INDEX idx_outbound_attempt_pending_retry 
  ON outbound_attempt(next_retry_at) 
  WHERE next_retry_at IS NOT NULL;
```

**Verdict:** Must remain in `migration-postgres/`. H2 does not support WHERE clauses in CREATE INDEX statements.

---

### ✅ V102__Seed_referentials_dynamic.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **DO $$ blocks (PL/pgSQL)**
   - PostgreSQL procedural language for anonymous code blocks
   - H2 does not support PL/pgSQL syntax or DO blocks
   
2. **DECLARE...BEGIN...END block structure**
   - PostgreSQL procedural syntax
   
3. **FOR...LOOP with RECORD type**
   - PostgreSQL-specific looping construct
   
4. **RAISE NOTICE**
   - PostgreSQL logging statement

**Example:**
```sql
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN 
        SELECT DISTINCT org_id FROM dossier WHERE org_id IS NOT NULL
    LOOP
        -- Dynamic seeding logic
        RAISE NOTICE 'Seeded referentials for org_id: %', org_record.org_id;
    END LOOP;
END $$;
```

**Corresponding H2-compatible version:** 
- V15__Seed_default_referentials.sql (only seeds DEFAULT-ORG, simple INSERT statements)

**Verdict:** Must remain in `migration-postgres/`. H2 cannot execute DO blocks or PL/pgSQL.

---

### ✅ V103__Add_referential_versioning.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **DO $$ blocks (PL/pgSQL)**
   - Used for conditional column addition with IF NOT EXISTS checks
   
2. **Dynamic schema introspection**
   - Queries `information_schema.columns` within procedural block
   
3. **Conditional DDL execution**
   - PostgreSQL allows ALTER TABLE within IF blocks in DO statements

**Example:**
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'referential' AND column_name = 'version') THEN
        ALTER TABLE referential ADD COLUMN version BIGINT DEFAULT 1;
    END IF;
END $$;
```

**Corresponding H2-compatible version:**
- V27__Add_referential_versioning.sql (uses simple ALTER TABLE, no DO blocks)

**Differences:**
- **PostgreSQL version (V103):** Uses DO blocks for conditional checks to prevent errors if columns already exist
- **H2 version (V27):** Uses direct ALTER TABLE statements (relies on IF NOT EXISTS in base table creation or expects clean state)

**Verdict:** Must remain in `migration-postgres/`. The DO block syntax is PostgreSQL-specific and provides idempotent migration behavior.

---

### ✅ V104__Seed_default_referentials_per_org.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **ON CONFLICT clause (UPSERT)**
   - PostgreSQL extension for handling unique constraint violations
   - `INSERT ... ON CONFLICT (columns) DO NOTHING`
   - H2 does not support ON CONFLICT syntax
   
2. **Multi-row VALUES insert with conflict resolution**
   - Idempotent seeding pattern

**Example:**
```sql
INSERT INTO referential (org_id, category, code, label, ...)
VALUES
  ('DEMO-ORG', 'CASE_TYPE', 'CRM_LEAD_BUY', 'Prospect Achat', ...),
  ('DEMO-ORG', 'CASE_TYPE', 'CRM_LEAD_RENT', 'Prospect Location', ...)
ON CONFLICT (org_id, category, code) DO NOTHING;
```

**Corresponding H2-compatible version:**
- V28__Seed_default_referentials_per_org.sql (deprecated, now empty - seeding handled by SeedDataLoader)
- V15__Seed_default_referentials.sql (simple INSERT for DEFAULT-ORG only)

**Verdict:** Must remain in `migration-postgres/`. H2 does not support ON CONFLICT syntax. H2 uses application-level seeding via SeedDataLoader.

---

### ✅ V105__Add_Index_metadata.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **GIN index on JSONB column**
   - `USING gin (metadata)`
   - PostgreSQL-specific JSONB data type and GIN index
   - H2 does not have native JSONB type or GIN indexes

**Example:**
```sql
CREATE INDEX IF NOT EXISTS idx_activity_metadata 
  ON activity USING GIN (metadata);
```

**Corresponding H2-compatible version:**
- V39__Add_Index_metadata.sql (creates standard index without USING GIN)

**Differences:**
- **PostgreSQL version (V105):** Uses GIN index for efficient JSONB querying with operators like @>, ?, ?&, ?|
- **H2 version (V39):** Uses standard B-tree index on JSON column (limited query optimization)

**Verdict:** Must remain in `migration-postgres/`. GIN indexes are PostgreSQL-specific and provide significant performance benefits for JSONB queries.

---

### ✅ V106__Add_partial_index_sms_provider_config_enabled.postgresql.sql

**Status:** PostgreSQL-specific (CONFIRMED)

**PostgreSQL-specific features:**
1. **Partial indexes with WHERE clause**
   - Multiple partial indexes with boolean and null predicates
   - Not supported in H2

**Examples:**
```sql
CREATE INDEX IF NOT EXISTS idx_sms_provider_config_enabled_true
  ON sms_provider_config (enabled)
  WHERE enabled IS TRUE;

CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_throttle_until_not_null
  ON sms_rate_limit (throttle_until)
  WHERE throttle_until IS NOT NULL;
```

**Note:** Filename includes `.postgresql.sql` suffix, explicitly marking it as PostgreSQL-specific.

**Verdict:** Must remain in `migration-postgres/`. Partial indexes are PostgreSQL-exclusive.

---

### ⚠️ V107__Add_in_app_notification_fields.sql

**Status:** PostgreSQL-specific (CONFIRMED with caveat)

**PostgreSQL-specific features:**
1. **Partial index with compound WHERE clause**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_notification_unread 
     ON notification(type, read_at) 
     WHERE type = 'IN_APP' AND read_at IS NULL;
   ```

**Corresponding H2-compatible version:**
- V33__Add_in_app_notification_fields.sql

**Differences:**
- **PostgreSQL version (V107):** 
  - Uses partial index: `WHERE type = 'IN_APP' AND read_at IS NULL`
  - More efficient for querying unread notifications
  
- **H2 version (V33):**
  - Attempts to use same syntax (partial index)
  - **POTENTIAL ISSUE:** H2 does not support partial indexes
  - This migration may fail on H2 or silently create a full index

**Recommendation:** 
The H2 version (V33) should be reviewed and corrected. It currently attempts to use PostgreSQL-specific partial index syntax:
```sql
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at) 
  WHERE type = 'IN_APP' AND read_at IS NULL;
```

This should be changed to a standard index for H2:
```sql
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at);
```

**Verdict:** Must remain in `migration-postgres/`. The partial index is PostgreSQL-specific and provides better performance.

---

## Summary Table

| Migration | PostgreSQL Features | H2 Compatible? | Base Migration Equivalent | Should Move? |
|-----------|-------------------|----------------|---------------------------|--------------|
| V100 | GIN indexes, to_tsvector() | ❌ No | None | ❌ No |
| V101 | Partial indexes (WHERE) | ❌ No | None | ❌ No |
| V102 | DO blocks, PL/pgSQL, FOR loops | ❌ No | V15 (partial) | ❌ No |
| V103 | DO blocks, conditional DDL | ❌ No | V27 (simplified) | ❌ No |
| V104 | ON CONFLICT (upsert) | ❌ No | V28 (deprecated) | ❌ No |
| V105 | GIN index on JSONB | ❌ No | V39 (B-tree) | ❌ No |
| V106 | Partial indexes (WHERE) | ❌ No | None | ❌ No |
| V107 | Partial index (WHERE) | ❌ No | V33 (needs fix) | ❌ No |

---

## Recommendations

### 1. All PostgreSQL migrations validated ✅
All migrations V100-V107 correctly use PostgreSQL-specific features and should remain in `migration-postgres/`.

### 2. Fix H2 migration V33 ⚠️
The H2 version of V33 should be corrected to remove the WHERE clause from the index creation:

**Current (incorrect for H2):**
```sql
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at) 
  WHERE type = 'IN_APP' AND read_at IS NULL;
```

**Should be:**
```sql
CREATE INDEX IF NOT EXISTS idx_notification_unread 
  ON notification(type, read_at);
```

### 3. Document migration strategy 📝
Consider adding a README in `migration-postgres/` explaining:
- Why these migrations are PostgreSQL-specific
- How to handle similar features in H2 (when possible)
- Migration testing strategy for both databases

### 4. Flyway configuration validation ✅
Ensure Flyway is configured to:
- Use `migration-postgres/` folder when running against PostgreSQL
- Use `migration/` folder for H2
- Properly handle version precedence if both folders contain same version number

---

## Conclusion

**All migrations V100-V107 are correctly placed in the PostgreSQL-specific migration folder.** They utilize PostgreSQL-exclusive features (GIN indexes, partial indexes, PL/pgSQL blocks, UPSERT syntax, JSONB optimizations) that have no direct H2 equivalents. Moving any of these migrations to the base migration folder would cause failures in H2 environments.

The architecture correctly separates database-specific optimizations from portable base migrations, ensuring compatibility with both PostgreSQL (production) and H2 (testing/development).
