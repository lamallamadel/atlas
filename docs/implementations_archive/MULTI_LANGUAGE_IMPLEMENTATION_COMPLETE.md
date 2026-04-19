# Multi-Language Appointment Reminder System - Implementation Complete

## Overview
Implemented a comprehensive multi-language appointment reminder system with locale-aware templates supporting French (fr_FR), English (en_US), and Arabic (ar_MA) with RTL rendering support.

## Implementation Summary

### 1. Database Migration (V141)
**File:** `backend/src/main/resources/db/migration/V141__Add_locale_to_dossier.sql`
- Added `locale VARCHAR(10)` column to `dossier` table
- Created index `idx_dossier_locale` for query performance
- Default value: 'fr_FR' for existing records
- Auto-detected from phone number country code using libphonenumber for new records

### 2. Backend Services

#### LocaleDetectionService
**File:** `backend/src/main/java/com/example/backend/service/LocaleDetectionService.java`
- Uses Google libphonenumber library to detect locale from phone number
- Maps country codes to locales (e.g., MA→ar_MA, US→en_US, FR→fr_FR)
- Provides RTL language detection

#### LocaleUtils
**File:** `backend/src/main/java/com/example/backend/util/LocaleUtils.java`
- Utility methods for locale operations
- Date/time formatting using `DateTimeFormatter.ofLocalizedDate/Time(FormatStyle.MEDIUM).withLocale()`
- Locale normalization and validation
- RTL language detection
- Localized greeting and label generation

#### DossierService Enhancement
- Auto-initializes `dossier.locale` from phone number on creation (lines 118-121)
- Uses `LocaleDetectionService.detectLocaleFromPhone()` method

#### WhatsAppTemplateService.getLocalizedTemplate()
**File:** `backend/src/main/java/com/example/backend/service/WhatsAppTemplateService.java` (lines 78-106)
- Queries `WhatsAppTemplate` by name and locale
- Implements fallback chain: requested locale → fr_FR → en_US
- Supports all locale formats (fr_FR, en_US, ar_MA, es_ES, de_DE)

#### WhatsAppTemplateService.submitTemplateTranslation()
**File:** `backend/src/main/java/com/example/backend/service/WhatsAppTemplateService.java` (lines 556-615)
- Submits locale variants to Meta Business API
- Automatically detects and applies RTL text direction for Arabic/Hebrew/Farsi/Urdu
- Creates translated template records with proper language codes

#### MetaBusinessApiService.submitTemplateTranslation()
**File:** `backend/src/main/java/com/example/backend/service/MetaBusinessApiService.java` (lines 84-153)
- Submits template translations to Meta API with `language_code` parameter
- Adds `text_direction: "RTL"` metadata to BODY and HEADER components for RTL languages
- Method: `addRtlDirectionMetadata()` for automatic RTL support

#### AppointmentReminderScheduler Updates
**File:** `backend/src/main/java/com/example/backend/service/AppointmentReminderScheduler.java`
- Retrieves `dossier.locale` for each appointment (lines 138-141, 221-224)
- Uses locale-specific template via `WhatsAppTemplateService.getLocalizedTemplate()` (line 341)
- Formats dates using `formatDateForLocale()` with `DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)` (lines 262-272)
- Formats times using `formatTimeForLocale()` with `DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)` (lines 274-283)
- Provides localized default strings for client names, agent names, locations (lines 286-336)

### 3. REST API Endpoints

#### POST /api/v1/whatsapp/templates/{id}/translations
**File:** `backend/src/main/java/com/example/backend/controller/WhatsAppTemplateController.java` (lines 355-382)
- Submits locale variants of templates to Meta API
- Request body: `TemplateTranslationRequest`
  - `languageCode`: Language code (e.g., "fr_FR", "ar_MA")
  - `components`: Template components in target language
  - `description`: Optional description
  - `setRtlDirection`: Boolean to force RTL rendering
- Response: `TemplateTranslationResponse` with submission status
- Automatically sets RTL direction for Arabic/Hebrew languages

### 4. DTOs

#### TemplateTranslationRequest
**File:** `backend/src/main/java/com/example/backend/dto/TemplateTranslationRequest.java`
- `languageCode`: @Pattern(regexp = "^[a-z]{2}_[A-Z]{2}$")
- `components`: List<Map<String, Object>>
- `description`: String (max 1000 chars)
- `setRtlDirection`: Boolean

#### TemplateTranslationResponse
**File:** `backend/src/main/java/com/example/backend/dto/TemplateTranslationResponse.java`
- `templateId`: Long
- `name`: String
- `languageCode`: String
- `status`: String
- `metaSubmissionId`: String
- `whatsAppTemplateId`: String

#### Updated Entities
**DossierResponse, DossierCreateRequest**: Added `locale` field
**AppointmentCreateRequest**: Added `locale` field

### 5. Frontend Implementation

#### Appointment Form Dialog
**Files:** 
- `frontend/src/app/components/appointment-form-dialog.component.ts`
- `frontend/src/app/components/appointment-form-dialog.component.html`

**Changes:**
- Added locale selector dropdown with options:
  - Français (France) - fr_FR
  - English (US) - en_US
  - العربية (المغرب) - ar_MA
  - Español (España) - es_ES
  - Deutsch (Deutschland) - de_DE
- Default value: 'fr_FR'
- Integrated into appointment creation form
- Updates dossier locale when appointment is created

#### AppointmentMapper
**File:** `backend/src/main/java/com/example/backend/dto/AppointmentMapper.java` (lines 54-57)
- Updates dossier locale from appointment request
- Persists locale preference when appointment is created

#### TypeScript Interfaces
**File:** `frontend/src/app/services/dossier-api.service.ts`
- Added `locale?: string` to `DossierResponse`
- Added `locale?: string` to `DossierCreateRequest`

**File:** `frontend/src/app/services/appointment-api.service.ts`
- Added `locale?: string` to `AppointmentCreateRequest`

### 6. RTL Support

#### Automatic RTL Detection
- `LocaleDetectionService.isRtlLanguage()`: Detects ar_, he_, fa_, ur_ prefixes
- `MetaBusinessApiService.addRtlDirectionMetadata()`: Adds `text_direction: "RTL"` to components
- Supported RTL languages: Arabic, Hebrew, Farsi, Urdu

#### Template Component Metadata
For RTL languages, BODY and HEADER components automatically receive:
```json
{
  "type": "BODY",
  "text": "نص عربي",
  "text_direction": "RTL"
}
```

## Supported Locales

| Locale | Language | Region | RTL |
|--------|----------|--------|-----|
| fr_FR | Français | France | No |
| en_US | English | United States | No |
| ar_MA | العربية | Morocco | Yes |
| es_ES | Español | Spain | No |
| de_DE | Deutsch | Germany | No |
| it_IT | Italiano | Italy | No |
| pt_PT | Português | Portugal | No |

## Date/Time Formatting Examples

### French (fr_FR)
- Date: "26 févr. 2026"
- Time: "14:30"
- DateTime: "26 févr. 2026, 14:30:00"

### English (en_US)
- Date: "Feb 26, 2026"
- Time: "2:30 PM"
- DateTime: "Feb 26, 2026, 2:30:00 PM"

### Arabic (ar_MA)
- Date: "٢٦‏/٠٢‏/٢٠٢٦"
- Time: "٢:٣٠ م"
- DateTime: "٢٦‏/٠٢‏/٢٠٢٦, ٢:٣٠:٠٠ م"

## Usage Flow

### 1. Dossier Creation
```java
// When creating a dossier with phone number
DossierCreateRequest request = new DossierCreateRequest();
request.setLeadPhone("+212612345678"); // Morocco
// Locale is auto-detected: ar_MA
```

### 2. Appointment Creation with Locale Override
```typescript
// Frontend appointment form
const appointment = {
  dossierId: 123,
  startTime: "2026-02-26T14:30:00",
  endTime: "2026-02-26T15:30:00",
  locale: "fr_FR" // Override auto-detected locale
};
```

### 3. Template Localization
```java
// Service automatically selects localized template
WhatsAppTemplate template = whatsAppTemplateService
    .getLocalizedTemplate("appointment_reminder", dossier.getLocale());
// Falls back: ar_MA → fr_FR → en_US if not found
```

### 4. Appointment Reminder Sending
```java
// Scheduler formats dates in user's locale
String dateStr = formatDateForLocale(appointment.getStartTime(), locale);
// fr_FR: "26 févr. 2026"
// en_US: "Feb 26, 2026"
// ar_MA: "٢٦‏/٠٢‏/٢٠٢٦"
```

### 5. Template Translation Submission
```bash
POST /api/v1/whatsapp/templates/123/translations
{
  "languageCode": "ar_MA",
  "components": [
    {
      "type": "BODY",
      "text": "مرحبا {{1}}، لديك موعد في {{2}}"
    }
  ],
  "setRtlDirection": true
}
```

## Dependencies

### Already Present
- `com.googlecode.libphonenumber:libphonenumber:8.13.26` (pom.xml line 253-256)

### Java Standard Library
- `java.time.format.DateTimeFormatter`
- `java.time.format.FormatStyle`
- `java.util.Locale`

## Files Modified

### Backend Java
1. `backend/src/main/java/com/example/backend/entity/Dossier.java`
2. `backend/src/main/java/com/example/backend/service/DossierService.java`
3. `backend/src/main/java/com/example/backend/service/WhatsAppTemplateService.java`
4. `backend/src/main/java/com/example/backend/service/AppointmentReminderScheduler.java`
5. `backend/src/main/java/com/example/backend/service/MetaBusinessApiService.java`
6. `backend/src/main/java/com/example/backend/controller/WhatsAppTemplateController.java`
7. `backend/src/main/java/com/example/backend/dto/DossierResponse.java`
8. `backend/src/main/java/com/example/backend/dto/DossierMapper.java`
9. `backend/src/main/java/com/example/backend/dto/DossierCreateRequest.java`
10. `backend/src/main/java/com/example/backend/dto/AppointmentCreateRequest.java`
11. `backend/src/main/java/com/example/backend/dto/AppointmentMapper.java`

### Backend New Files
1. `backend/src/main/java/com/example/backend/service/LocaleDetectionService.java`
2. `backend/src/main/java/com/example/backend/util/LocaleUtils.java`
3. `backend/src/main/java/com/example/backend/dto/TemplateTranslationRequest.java`
4. `backend/src/main/java/com/example/backend/dto/TemplateTranslationResponse.java`
5. `backend/src/main/resources/db/migration/V141__Add_locale_to_dossier.sql`

### Frontend TypeScript
1. `frontend/src/app/components/appointment-form-dialog.component.ts`
2. `frontend/src/app/components/appointment-form-dialog.component.html`
3. `frontend/src/app/services/dossier-api.service.ts`
4. `frontend/src/app/services/appointment-api.service.ts`

## Testing Checklist

### Manual Testing
- [ ] Create dossier with Moroccan phone (+212...) → locale should be ar_MA
- [ ] Create dossier with US phone (+1...) → locale should be en_US
- [ ] Create dossier with French phone (+33...) → locale should be fr_FR
- [ ] Create appointment with locale override → dossier locale should update
- [ ] View appointment reminder in different locales → dates formatted correctly
- [ ] Submit Arabic template translation → RTL metadata should be set
- [ ] Submit English template translation → RTL metadata should NOT be set

### API Testing
```bash
# Submit Arabic translation
curl -X POST http://localhost:8080/api/v1/whatsapp/templates/1/translations \
  -H "Content-Type: application/json" \
  -d '{
    "languageCode": "ar_MA",
    "components": [{"type":"BODY","text":"مرحبا {{1}}"}],
    "setRtlDirection": true
  }'

# Get localized template
# Should return ar_MA template, or fallback to fr_FR, then en_US
```

## Notes

### Migration Cleanup Required
**IMPORTANT:** Before running tests or deployment, manually delete these duplicate migration files:
- `backend/src/main/resources/db/migration/V139__Add_locale_to_dossier.sql`
- `backend/src/main/resources/db/migration/V139__Add_locale_to_dossier_DELETE_ME.sql`
- `backend/src/main/resources/db/migration/V140__Add_locale_to_dossier.sql`

See `backend/src/main/resources/db/migration/CLEANUP_NEEDED.md` for details.

### Locale Detection Logic
1. **On Dossier Creation:** If `locale` is not provided, it's auto-detected from `leadPhone` using libphonenumber
2. **On Appointment Creation:** If `locale` is provided in the request, it updates the dossier's locale
3. **Fallback Chain:** ar_MA → fr_FR → en_US → throws exception if none found

### RTL Rendering
- Automatically enabled for languages with codes: ar_, he_, fa_, ur_
- Can be forced via `setRtlDirection: true` in API request
- Adds `text_direction: "RTL"` to BODY and HEADER components only

## Future Enhancements

1. **Additional Locales:** Add support for more languages (Italian, Portuguese, etc.)
2. **User Preferences:** Allow users to override auto-detected locale in profile settings
3. **Template Preview:** Add UI to preview templates in different locales before sending
4. **Batch Translation:** Support translating multiple templates at once
5. **Translation Validation:** Validate that variable placeholders match across translations
6. **Locale Analytics:** Track reminder effectiveness by locale
