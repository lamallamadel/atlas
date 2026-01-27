# JSONB Audit Quick Reference

## Quick Summary

**Audit Scope**: Migrations V1-V37  
**Status**: ✅ Audit Complete  
**Migrations Needing Fix**: 4 (V34, V35, V36, V37)  
**Total Column Definitions to Fix**: 7

## Files Generated

1. **MIGRATION_JSONB_AUDIT.md** - Full detailed audit report with analysis
2. **MIGRATION_JSONB_AUDIT.csv** - Spreadsheet-compatible matrix
3. **MIGRATION_JSONB_AUDIT.json** - Machine-readable audit data

## At a Glance

### ❌ Migrations with Hardcoded JSONB

| Priority | Migration | Table(s) | Columns | Status |
|----------|-----------|----------|---------|--------|
| 🔴 High | V34 | `user_preferences` | 3 columns | Needs Fix |
| 🔴 High | V35 | `filter_preset` | 1 column (NOT NULL) | Needs Fix |
| 🟡 Medium | V36 | `comment` | 1 column | Needs Fix |
| 🟡 Medium | V37 | `suggestion_template`, `message_template` | 2 columns | Needs Fix |

### ✅ Migrations Using ${json_type} Correctly

V2, V3, V6, V13, V16, V20, V25, V30, V32 - All good! ✅

## Why This Matters

### The Problem
Hardcoded `JSONB` breaks H2 compatibility:
- ❌ E2E tests with H2 profile fail
- ❌ No database portability
- ❌ Features broken in H2 mode

### The Solution
Use `${json_type}` placeholder:
- ✅ H2: Resolves to `JSON`
- ✅ PostgreSQL: Resolves to `JSONB`
- ✅ Full portability

## Configuration

```yaml
# H2 Profile (application-e2e-h2-mock.yml)
flyway:
  placeholders:
    json_type: JSON

# PostgreSQL Profile (application-e2e-postgres-mock.yml)
flyway:
  placeholders:
    json_type: JSONB
```

## Next Steps

1. Review full audit: `MIGRATION_JSONB_AUDIT.md`
2. Decide on refactoring strategy (Option 2 recommended: correction migrations)
3. Create fix migrations V38-V41
4. Test with both H2 and PostgreSQL profiles

## Quick Commands

### View All Findings
```bash
cat backend/src/main/resources/db/migration/MIGRATION_JSONB_AUDIT.csv
```

### Search for JSONB in V1-V37
```powershell
Get-ChildItem -Path "backend/src/main/resources/db/migration" -Filter "V*.sql" | 
  Where-Object { $_.Name -match '^V([1-9]|[1-2][0-9]|3[0-7])__' } | 
  Select-String -Pattern "JSONB" -CaseSensitive
```

### Verify Correct Usage
```powershell
Get-ChildItem -Path "backend/src/main/resources/db/migration" -Filter "V*.sql" | 
  Select-String -Pattern '\$\{json_type\}'
```

## Refactoring Template

```sql
-- V38__Fix_[table_name]_json_type.sql
-- Corrects hardcoded JSONB to ${json_type} placeholder for H2 compatibility

ALTER TABLE [table_name] ALTER COLUMN [column_name] TYPE ${json_type};
```

---

For full details, see: **MIGRATION_JSONB_AUDIT.md**
