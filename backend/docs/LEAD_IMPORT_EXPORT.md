# Lead Import/Export Documentation

## Overview

The Lead Import/Export functionality allows bulk operations on leads (dossiers) via CSV files.

## Import Leads

### Endpoint
```
POST /api/v1/leads/import
```

### Parameters
- `file` (required): CSV file containing leads
- `mergeStrategy` (optional, default: SKIP): How to handle duplicates
  - `SKIP`: Skip duplicate leads (based on phone number)
  - `OVERWRITE`: Update existing leads with new data
  - `CREATE_NEW`: Always create new leads regardless of duplicates

### CSV Format

Required columns:
- `name`: Lead name (required)
- `phone`: Lead phone number (required)
- `source`: Lead source (required) - must be one of: web, mobile, phone, email, referral, walk_in, social_media, unknown

Optional columns:
- `email`: Lead email address
- `lead_source`: Additional source information
- `notes`: Notes about the lead
- `score`: Lead score (0-100)

### Sample CSV
```csv
name,phone,email,source,lead_source,notes,score
John Doe,+33612345678,john@example.com,web,Google Ads,Interested in 2-bedroom apartment,85
Jane Smith,+33698765432,jane@example.com,phone,Direct Call,Looking for property in Paris,70
Bob Wilson,+33687654321,bob@example.com,referral,Partner Network,Premium buyer,95
```

### Response
```json
{
  "importJobId": 123,
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 3,
  "skippedCount": 2,
  "validationErrors": [
    {
      "row": 5,
      "field": "phone",
      "message": "Phone is required"
    },
    {
      "row": 12,
      "field": "source",
      "message": "Invalid source value: invalid_source"
    }
  ]
}
```

## Export Leads

### Endpoint
```
GET /api/v1/leads/export
```

### Query Parameters (all optional)
- `status`: Filter by status (NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, DRAFT, LOST)
- `startDate`: Filter by start date (ISO format: yyyy-MM-dd'T'HH:mm:ss)
- `endDate`: Filter by end date (ISO format: yyyy-MM-dd'T'HH:mm:ss)
- `source`: Filter by source (WEB, MOBILE, PHONE, EMAIL, REFERRAL, WALK_IN, SOCIAL_MEDIA, UNKNOWN)
- `columns`: Comma-separated list of columns to include

### Available Columns
- `id`: Lead ID
- `name`: Lead name
- `phone`: Lead phone
- `email`: Lead email
- `source`: Lead source
- `lead_source`: Additional source info
- `status`: Lead status
- `score`: Lead score
- `notes`: Lead notes
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `created_by`: Creator user
- `updated_by`: Last updater user
- `annonce_id`: Associated property ID
- `case_type`: Case type
- `status_code`: Status code
- `loss_reason`: Reason for loss
- `won_reason`: Reason for win

Default columns (if not specified): `id,name,phone,email,source,lead_source,status,score,notes,created_at,updated_at`

### Example Requests

Export all leads:
```
GET /api/v1/leads/export
```

Export leads with specific status:
```
GET /api/v1/leads/export?status=NEW
```

Export leads within date range:
```
GET /api/v1/leads/export?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59
```

Export leads with custom columns:
```
GET /api/v1/leads/export?columns=id,name,phone,email,status,score
```

Export leads with multiple filters:
```
GET /api/v1/leads/export?status=QUALIFIED&source=WEB&startDate=2024-01-01T00:00:00&columns=id,name,phone,email,score
```

### Response
The response is a streaming CSV file download with filename format: `leads_export_YYYYMMDD_HHMMSS.csv`

## Import History

### Get Import History
```
GET /api/v1/leads/import/history
```

Returns a list of all import jobs for the organization.

### Get Import Job Details
```
GET /api/v1/leads/import/history/{id}
```

Returns detailed information about a specific import job, including error report.

### Response
```json
{
  "id": 123,
  "filename": "leads_2024.csv",
  "status": "COMPLETED",
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 3,
  "skippedCount": 2,
  "errorReport": "Row 5: Validation failed\nRow 12: Invalid source value\nRow 45: Phone is required\n",
  "createdAt": "2024-01-15T10:30:00",
  "createdBy": "user@example.com"
}
```

## Validation Rules

### Import Validation
1. **Name**: Required, cannot be empty
2. **Phone**: Required, cannot be empty, used for duplicate detection
3. **Source**: Required, must be valid enum value (web, mobile, phone, email, referral, walk_in, social_media, unknown)
4. **Score**: Optional, must be integer between 0-100

### Duplicate Detection
- Duplicates are detected by matching phone number within the same organization
- Only active leads are checked (excludes WON and LOST status)
- Merge strategy determines how duplicates are handled

## Error Handling

- Invalid CSV format: 400 Bad Request
- Missing required fields: Logged in validation errors, row skipped
- Invalid enum values: Logged in validation errors, row skipped
- Database errors: 500 Internal Server Error, import job marked as FAILED

## Security

- All endpoints require authentication
- User must have ADMIN or PRO role
- Organization isolation is enforced via org_id filter
- Only users from the same organization can access import history

## Performance Considerations

- Import operations are transactional
- Large CSV files (>10,000 rows) may take several seconds
- Export uses streaming to handle large datasets efficiently
- Indexes on dossier table optimize filtering performance
