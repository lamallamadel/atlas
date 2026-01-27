# Migration JSONB Audit Report (V1-V37)

## Executive Summary

This document provides a comprehensive audit of migrations V1-V37 to identify those using hardcoded `JSONB` instead of the `${json_type}` placeholder. The `${json_type}` placeholder is dynamically resolved by Flyway based on the database profile:
- **PostgreSQL profiles**: `${json_type}` → `JSONB`
- **H2 profiles**: `${json_type}` → `JSON`

This approach ensures database portability and allows E2E tests to run with both H2 (fast, in-memory) and PostgreSQL (production-like).

## Configuration Context

### Flyway Placeholder Configuration

**H2 Profile** (`application-e2e-h2-mock.yml`):
```yaml
flyway:
  placeholders:
    json_type: JSON
```

**PostgreSQL Profile** (`application-e2e-postgres-mock.yml`):
```yaml
flyway:
  placeholders:
    json_type: JSONB
```

## Audit Methodology

```powershell
# Command used to identify hardcoded JSONB usage
Get-ChildItem -Path "backend/src/main/resources/db/migration" -Filter "V*.sql" | 
  Where-Object { $_.Name -match '^V([1-9]|[1-2][0-9]|3[0-7])__' } | 
  Select-String -Pattern "JSONB" -CaseSensitive
```

## Audit Results Matrix

| Migration | File | Line | Column Name | Type Used | Needs Refactoring | Priority | Notes |
|-----------|------|------|-------------|-----------|-------------------|----------|-------|
| V2 | `V2__Add_jsonb_and_missing_columns.sql` | 1 | N/A (comment) | N/A | ❌ No | Low | Comment only, informational |
| V34 | `V34__Add_user_preferences.sql` | 8 | `dashboard_layout` | `JSONB` | ✅ Yes | High | User preferences table |
| V34 | `V34__Add_user_preferences.sql` | 9 | `widget_settings` | `JSONB` | ✅ Yes | High | User preferences table |
| V34 | `V34__Add_user_preferences.sql` | 10 | `general_preferences` | `JSONB` | ✅ Yes | High | User preferences table |
| V35 | `V35__Add_filter_preset_entity.sql` | 7 | `filter_config` | `JSONB NOT NULL` | ✅ Yes | High | Filter preset config |
| V36 | `V36__Add_comment_threads.sql` | 20 | `mentions_json` | `JSONB` | ✅ Yes | Medium | Comment mentions |
| V37 | `V37__Add_smart_suggestions.sql` | 32 | `action_payload` | `JSONB` | ✅ Yes | Medium | Suggestion action payload |
| V37 | `V37__Add_smart_suggestions.sql` | 51 | `variables` | `JSONB` | ✅ Yes | Medium | Template variables |

### Summary Statistics

- **Total migrations audited**: 37 (V1 to V37)
- **Migrations with JSONB references**: 5 (V2, V34, V35, V36, V37)
- **Migrations needing refactoring**: 4 (V34, V35, V36, V37)
- **Total JSONB occurrences**: 8
- **JSONB occurrences needing fix**: 7 (excluding V2 comment)

## Detailed Analysis by Migration

### ✅ V2__Add_jsonb_and_missing_columns.sql
**Status**: ✅ Correct - No refactoring needed

**Usage**:
```sql
-- Line 1: Comment only (informational)
-- Add JSON columns to annonce (Postgres: JSONB, H2: JSON)

-- Lines 2-21: Correctly using ${json_type} placeholder
ALTER TABLE annonce ADD COLUMN photos_json ${json_type};
ALTER TABLE annonce ADD COLUMN rules_json ${json_type};
ALTER TABLE partie_prenante ADD COLUMN meta_json ${json_type};
ALTER TABLE consentement ADD COLUMN meta_json ${json_type};
ALTER TABLE audit_event ADD COLUMN diff_json ${json_type};
```

**Assessment**: ✅ This migration correctly uses `${json_type}` for all JSON columns. The word "JSONB" appears only in a comment for documentation purposes.

---

### ❌ V34__Add_user_preferences.sql
**Status**: ❌ Needs Refactoring - High Priority

**Current Usage** (Lines 8-10):
```sql
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    org_id VARCHAR(255) NOT NULL,
    dashboard_layout JSONB,        -- ❌ Hardcoded JSONB
    widget_settings JSONB,         -- ❌ Hardcoded JSONB
    general_preferences JSONB,     -- ❌ Hardcoded JSONB
    theme VARCHAR(50),
    -- ... rest of columns
);
```

**Impact**:
- ❌ Incompatible with H2 database (E2E tests with H2 profile will fail)
- ❌ Breaks database portability
- ❌ User preferences dashboard customization won't work in H2 mode

**Recommendation**: Replace all 3 occurrences with `${json_type}`

**Priority**: **High** - User preferences is a core feature for dashboard customization

---

### ❌ V35__Add_filter_preset_entity.sql
**Status**: ❌ Needs Refactoring - High Priority

**Current Usage** (Line 7):
```sql
CREATE TABLE filter_preset (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,
    description TEXT,
    filter_config JSONB NOT NULL,  -- ❌ Hardcoded JSONB
    is_shared BOOLEAN DEFAULT false,
    -- ... rest of columns
);
```

**Impact**:
- ❌ Incompatible with H2 database (E2E tests with H2 profile will fail)
- ❌ Advanced filter presets feature broken in H2 mode
- ❌ NOT NULL constraint means this column is critical

**Recommendation**: Replace `JSONB NOT NULL` with `${json_type} NOT NULL`

**Priority**: **High** - Filter config is required (NOT NULL) and central to filter preset functionality

---

### ❌ V36__Add_comment_threads.sql
**Status**: ❌ Needs Refactoring - Medium Priority

**Current Usage** (Line 20):
```sql
CREATE TABLE comment (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    mentions_json JSONB,           -- ❌ Hardcoded JSONB
    org_id VARCHAR(255) NOT NULL,
    -- ... rest of columns
);
```

**Impact**:
- ❌ Incompatible with H2 database (E2E tests with H2 profile will fail)
- ❌ Comment mentions feature (user tagging) broken in H2 mode
- ℹ️ Column is nullable, so less critical than NOT NULL columns

**Recommendation**: Replace `JSONB` with `${json_type}`

**Priority**: **Medium** - Nullable column, but still important for collaboration features

---

### ❌ V37__Add_smart_suggestions.sql
**Status**: ❌ Needs Refactoring - Medium Priority

**Current Usage** (Lines 32, 51):
```sql
-- Line 32 in suggestion_template table
CREATE TABLE suggestion_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    trigger_condition VARCHAR(100) NOT NULL,
    suggestion_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    action_type VARCHAR(100) NOT NULL,
    action_payload JSONB,          -- ❌ Hardcoded JSONB
    -- ... rest of columns
);

-- Line 51 in message_template table
CREATE TABLE message_template (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB,               -- ❌ Hardcoded JSONB
    -- ... rest of columns
);
```

**Impact**:
- ❌ Incompatible with H2 database (E2E tests with H2 profile will fail)
- ❌ Smart suggestions system broken in H2 mode
- ❌ Message template variables not working in H2 mode
- ℹ️ Both columns are nullable

**Recommendation**: Replace both `JSONB` occurrences with `${json_type}`

**Priority**: **Medium** - Nullable columns, but important for AI/ML features

---

## Migrations Using ${json_type} Correctly

The following migrations (V1-V37) correctly use the `${json_type}` placeholder:

| Migration | File | JSON Columns |
|-----------|------|--------------|
| V2 | `V2__Add_jsonb_and_missing_columns.sql` | `photos_json`, `rules_json`, `meta_json`, `diff_json` |
| V3 | `V3__Complete_schema_and_constraints.sql` | `meta_json` |
| V6 | `V6__Add_notification_system.sql` | `variables` |
| V13 | `V13__Add_outbound_messaging.sql` | `payload_json`, `provider_response_json` |
| V16 | `V16__Add_workflow_engine.sql` | `conditions_json`, `required_fields_json`, `validation_errors_json` |
| V20 | `V20__Add_email_integration.sql` | `attachments_json` |
| V25 | `V25__Add_whatsapp_template_management.sql` | `components` |
| V30 | `V30__Add_activity_metadata_and_new_types.sql` | `metadata` |
| V32 | `V32__Add_coop_habitat_bounded_context.sql` | `meta` (4 occurrences) |

**Total correct usage**: 9 migrations with 18+ JSON columns using `${json_type}` ✅

---

## Refactoring Recommendations

### Priority 1: High Priority (Must Fix)

1. **V34__Add_user_preferences.sql** - 3 columns
   - `dashboard_layout JSONB` → `dashboard_layout ${json_type}`
   - `widget_settings JSONB` → `widget_settings ${json_type}`
   - `general_preferences JSONB` → `general_preferences ${json_type}`

2. **V35__Add_filter_preset_entity.sql** - 1 column (NOT NULL)
   - `filter_config JSONB NOT NULL` → `filter_config ${json_type} NOT NULL`

### Priority 2: Medium Priority (Should Fix)

3. **V36__Add_comment_threads.sql** - 1 column
   - `mentions_json JSONB` → `mentions_json ${json_type}`

4. **V37__Add_smart_suggestions.sql** - 2 columns
   - `action_payload JSONB` → `action_payload ${json_type}`
   - `variables JSONB` → `variables ${json_type}`

---

## Testing Impact

### Current State
- ❌ E2E tests with H2 profile (`application-e2e-h2-mock.yml`) will **FAIL** for:
  - User preferences features
  - Filter preset features
  - Comment threads with mentions
  - Smart suggestions system
  - Message templates with variables

- ✅ E2E tests with PostgreSQL profile (`application-e2e-postgres-mock.yml`) work correctly (JSONB native support)

### After Refactoring
- ✅ E2E tests with H2 profile will work (uses JSON type)
- ✅ E2E tests with PostgreSQL profile will continue to work (uses JSONB type)
- ✅ Full database portability achieved
- ✅ Consistent migration approach across all tables

---

## Migration Refactoring Strategy

### Option 1: Fix In-Place (Not Recommended)
Modify existing migrations V34, V35, V36, V37 directly.

**Pros**: 
- Direct fix
- No new migrations

**Cons**: 
- ❌ Violates Flyway best practices (immutable migrations)
- ❌ Checksum mismatch if migrations already applied
- ❌ Risk of breaking existing databases

### Option 2: Create Correction Migrations (Recommended)
Create new migrations V38+, V39+, V40+, V41+ to alter the column types.

**Pros**: 
- ✅ Follows Flyway best practices
- ✅ Safe for existing databases
- ✅ Clear audit trail

**Cons**: 
- Additional migrations
- Requires ALTER TABLE statements

**Example for V34 correction**:
```sql
-- V38__Fix_user_preferences_json_type.sql
-- Corrects hardcoded JSONB to use ${json_type} placeholder for H2 compatibility

-- PostgreSQL: This is a no-op (JSONB → JSONB)
-- H2: This converts JSONB → JSON (enables H2 support)

ALTER TABLE user_preferences ALTER COLUMN dashboard_layout TYPE ${json_type};
ALTER TABLE user_preferences ALTER COLUMN widget_settings TYPE ${json_type};
ALTER TABLE user_preferences ALTER COLUMN general_preferences TYPE ${json_type};
```

### Option 3: Hybrid Approach (Recommended for New Projects)
- For databases **not yet initialized**: Fix V34-V37 directly
- For databases **already running**: Use correction migrations (Option 2)

---

## Action Items

### Immediate Actions
1. ✅ **Document**: Create this audit report (completed)
2. 🔲 **Review**: Team review of audit findings
3. 🔲 **Decide**: Choose refactoring strategy (Option 2 recommended)

### Refactoring Tasks
4. 🔲 **Create V38**: Fix `user_preferences` table (3 columns)
5. 🔲 **Create V39**: Fix `filter_preset` table (1 column)
6. 🔲 **Create V40**: Fix `comment` table (1 column)
7. 🔲 **Create V41**: Fix `suggestion_template` and `message_template` tables (2 columns)

### Validation Tasks
8. 🔲 **Test H2**: Run E2E tests with H2 profile after fixes
9. 🔲 **Test PostgreSQL**: Verify PostgreSQL profile still works
10. 🔲 **Regression Test**: Full test suite validation

---

## Conclusion

**Summary**: 
- ✅ 24 migrations (V1-V37 minus 5 with JSONB) correctly use database-agnostic patterns
- ❌ 4 migrations (V34, V35, V36, V37) need refactoring
- 📊 7 total column definitions require fixing

**Recommendation**: 
Create correction migrations (V38-V41) to replace hardcoded `JSONB` with `${json_type}` placeholder, ensuring full H2 and PostgreSQL compatibility for E2E testing.

**Expected Outcome**: 
- Full database portability between H2 and PostgreSQL
- E2E tests working on both database profiles
- Consistent migration approach across entire codebase

---

## References

- [Flyway Placeholders Documentation](https://documentation.red-gate.com/fd/placeholders-184127506.html)
- [PostgreSQL JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [H2 Database JSON Support](https://h2database.com/html/datatypes.html#json_type)

---

**Audit Date**: 2024
**Auditor**: Automated Migration Audit Script
**Scope**: Migrations V1 through V37
**Status**: ✅ Audit Complete - Awaiting Refactoring
