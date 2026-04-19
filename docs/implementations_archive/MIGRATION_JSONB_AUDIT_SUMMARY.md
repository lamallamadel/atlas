# Migration JSONB Audit Summary

## Overview

A comprehensive audit of database migrations V1-V37 has been completed to identify migrations using hardcoded `JSONB` instead of the database-agnostic `${json_type}` placeholder.

## Audit Results

### Summary Statistics

- ✅ **Total Migrations Audited**: 37 (V1 through V37)
- ❌ **Migrations with JSONB**: 5
- ❌ **Migrations Needing Refactoring**: 4 (V34, V35, V36, V37)
- 📊 **Total JSONB Occurrences**: 8
- 🔧 **Fixes Required**: 7 column definitions

### Key Findings Matrix

| Migration | File | Table(s) | Columns to Fix | Priority | Impact |
|-----------|------|----------|----------------|----------|--------|
| V34 | `V34__Add_user_preferences.sql` | `user_preferences` | 3 | 🔴 High | Dashboard customization broken in H2 |
| V35 | `V35__Add_filter_preset_entity.sql` | `filter_preset` | 1 (NOT NULL) | 🔴 High | Filter presets broken in H2 |
| V36 | `V36__Add_comment_threads.sql` | `comment` | 1 | 🟡 Medium | Comment mentions broken in H2 |
| V37 | `V37__Add_smart_suggestions.sql` | `suggestion_template`, `message_template` | 2 | 🟡 Medium | Smart suggestions broken in H2 |

### Problem vs Solution

#### ❌ Current Problem
```sql
-- Hardcoded JSONB - breaks H2 compatibility
CREATE TABLE user_preferences (
    dashboard_layout JSONB,
    widget_settings JSONB
);
```

#### ✅ Correct Approach
```sql
-- Uses placeholder - works with both H2 and PostgreSQL
CREATE TABLE user_preferences (
    dashboard_layout ${json_type},
    widget_settings ${json_type}
);
```

## Configuration Context

The `${json_type}` placeholder is configured in Flyway and resolves differently per database:

- **PostgreSQL profiles**: `${json_type}` → `JSONB`
- **H2 profiles**: `${json_type}` → `JSON`

## Impact on Testing

### Current State (Broken)
- ❌ E2E tests with H2 profile **FAIL** for 4 feature areas
- ✅ E2E tests with PostgreSQL profile work (but slower)

### After Refactoring (Fixed)
- ✅ E2E tests with H2 profile work (fast, in-memory)
- ✅ E2E tests with PostgreSQL profile work (production-like)
- ✅ Full database portability achieved

## Detailed Documentation

Full audit documentation is available in the migration directory:

```
backend/src/main/resources/db/migration/
├── MIGRATION_JSONB_AUDIT.md       # Full detailed audit report
├── MIGRATION_JSONB_AUDIT.csv      # Spreadsheet-compatible matrix
├── MIGRATION_JSONB_AUDIT.json     # Machine-readable audit data
└── README_JSONB_AUDIT.md          # Quick reference guide
```

### Document Contents

1. **MIGRATION_JSONB_AUDIT.md** (Comprehensive Report)
   - Executive summary
   - Detailed analysis per migration
   - Refactoring recommendations
   - Testing impact assessment
   - Action items and next steps

2. **MIGRATION_JSONB_AUDIT.csv** (Quick Matrix)
   - Comma-separated values
   - Import into Excel/Sheets for filtering
   - Quick reference for planning

3. **MIGRATION_JSONB_AUDIT.json** (Programmatic Access)
   - Structured audit data
   - Refactoring plan
   - Metadata and statistics
   - API/tooling integration

4. **README_JSONB_AUDIT.md** (Quick Reference)
   - At-a-glance summary
   - Quick commands
   - Refactoring template
   - Configuration examples

## Recommended Next Steps

### 1. Review Phase
- [ ] Review full audit report: `backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.md`
- [ ] Team discussion on findings
- [ ] Decide on refactoring strategy

### 2. Implementation Phase (Recommended: Option 2 - Correction Migrations)
- [ ] Create V38: Fix `user_preferences` table (3 columns) - HIGH PRIORITY
- [ ] Create V39: Fix `filter_preset` table (1 column) - HIGH PRIORITY
- [ ] Create V40: Fix `comment` table (1 column) - MEDIUM PRIORITY
- [ ] Create V41: Fix `suggestion_template` and `message_template` tables (2 columns) - MEDIUM PRIORITY

### 3. Validation Phase
- [ ] Run E2E tests with H2 profile: `npm run e2e` (from frontend)
- [ ] Run E2E tests with PostgreSQL profile: `npm run e2e:postgres`
- [ ] Verify backend tests: `mvn verify -Pbackend-e2e-h2` and `mvn verify -Pbackend-e2e-postgres`
- [ ] Full regression test suite

## Quick Access Commands

### View Audit Matrix
```bash
# CSV format (import to Excel)
cat backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.csv

# JSON format (programmatic)
cat backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.json
```

### Search for JSONB Issues
```powershell
# Find all hardcoded JSONB in V1-V37
Get-ChildItem -Path "backend/src/main/resources/db/migration" -Filter "V*.sql" | 
  Where-Object { $_.Name -match '^V([1-9]|[1-2][0-9]|3[0-7])__' } | 
  Select-String -Pattern "JSONB" -CaseSensitive
```

### Verify Correct Usage
```powershell
# Find all correct ${json_type} usage
Get-ChildItem -Path "backend/src/main/resources/db/migration" -Filter "V*.sql" | 
  Select-String -Pattern '\$\{json_type\}'
```

## Refactoring Strategy (Recommended)

**Option 2: Create Correction Migrations**

Create new migrations (V38-V41) to alter column types. This is the safest approach.

**Example Template**:
```sql
-- V38__Fix_user_preferences_json_type.sql
-- Corrects hardcoded JSONB to ${json_type} placeholder for H2 compatibility

ALTER TABLE user_preferences ALTER COLUMN dashboard_layout TYPE ${json_type};
ALTER TABLE user_preferences ALTER COLUMN widget_settings TYPE ${json_type};
ALTER TABLE user_preferences ALTER COLUMN general_preferences TYPE ${json_type};
```

**Benefits**:
- ✅ Follows Flyway best practices (immutable migrations)
- ✅ Safe for existing databases
- ✅ Clear audit trail
- ✅ No checksum conflicts

## Migrations Already Correct ✅

The following migrations correctly use `${json_type}`:
- V2, V3, V6, V13, V16, V20, V25, V30, V32

These serve as good examples for proper usage.

## Conclusion

**Status**: 🟡 Audit Complete - Refactoring Required

**Priority**: High - Affects 4 feature areas and E2E testing capability

**Effort**: Low-Medium - 4 new migrations, straightforward ALTER TABLE statements

**Risk**: Low - Correction migrations are safe and reversible

---

**For Full Details**: See `backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.md`

**Audit Date**: 2024  
**Audit Scope**: Migrations V1-V37  
**Status**: ✅ Complete
