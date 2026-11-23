# Multi-Language Appointment Reminder - Quick Start Guide

## Overview

This guide shows you how to quickly use the multi-language appointment reminder system.

## For Backend Developers

### 1. Create Dossier with Auto-Detection

```java
// Locale is automatically detected from phone number
DossierCreateRequest request = new DossierCreateRequest();
request.setLeadPhone("+212612345678"); // Moroccan number
request.setLeadName("Ahmed Hassan");

DossierResponse dossier = dossierService.create(request);
// dossier.getLocale() will be "ar_MA"
```

### 2. Get Localized Template

```java
@Autowired
private WhatsAppTemplateService templateService;

// Gets Arabic template, falls back to French, then English
WhatsAppTemplate template = templateService.getLocalizedTemplate(
    "appointment_reminder",
    dossier.getLocale()
);
```

### 3. Format Date/Time by Locale

```java
String locale = dossier.getLocale(); // e.g., "ar_MA"
Locale javaLocale = new Locale(locale.split("_")[0], locale.split("_")[1]);

DateTimeFormatter dateFormatter = DateTimeFormatter
    .ofLocalizedDate(FormatStyle.MEDIUM)
    .withLocale(javaLocale);
    
String formattedDate = appointment.getStartTime().format(dateFormatter);
// French: "15 janv. 2024"
// English: "Jan 15, 2024"
// Arabic: "١٥ يناير ٢٠٢٤"
```

## For Frontend Developers

### 1. Add Locale Selector to Form

```typescript
import { LocaleSelectorComponent } from './components/locale-selector/locale-selector.component';

@Component({
  imports: [LocaleSelectorComponent],
  template: `
    <app-locale-selector
      [selectedLocale]="form.get('locale')?.value"
      (localeChange)="onLocaleChange($event)">
    </app-locale-selector>
  `
})
```

### 2. Create Dossier with Locale

```typescript
createDossier(data: any): Observable<Dossier> {
  return this.http.post<Dossier>('/api/v1/dossiers', {
    leadPhone: data.phone,
    leadName: data.name,
    locale: data.locale || 'fr_FR'
  });
}
```

### 3. Display Locale in UI

```html
<div class="dossier-info">
  <span class="locale-badge">
    {{ getFlagEmoji(dossier.locale) }} {{ getLocaleName(dossier.locale) }}
  </span>
</div>
```

```typescript
getFlagEmoji(locale: string): string {
  const flags = {
    'fr_FR': '🇫🇷',
    'en_US': '🇬🇧',
    'ar_MA': '🇲🇦',
    'es_ES': '🇪🇸',
    'de_DE': '🇩🇪'
  };
  return flags[locale] || '🌐';
}

getLocaleName(locale: string): string {
  const names = {
    'fr_FR': 'Français',
    'en_US': 'English',
    'ar_MA': 'العربية',
    'es_ES': 'Español',
    'de_DE': 'Deutsch'
  };
  return names[locale] || locale;
}
```

## For API Users

### Create Template Translation

```bash
curl -X POST https://api.example.com/api/v1/whatsapp/templates/42/translations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "languageCode": "ar_MA",
    "components": [
      {
        "type": "BODY",
        "text": "مرحبًا {{clientName}}، نذكرك بموعدك في {{dateStr}} الساعة {{timeStr}}"
      }
    ],
    "setRtlDirection": true
  }'
```

### Query Dossiers by Locale

```bash
curl -X GET "https://api.example.com/api/v1/dossiers?locale=ar_MA" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Patterns

### Pattern 1: Manual Locale Override

```java
// User manually sets locale
dossier.setLocale("en_US");
dossierRepository.save(dossier);
```

### Pattern 2: Locale from User Preferences

```java
// Get locale from user profile
User user = userService.getCurrentUser();
String preferredLocale = user.getPreferredLocale();
dossier.setLocale(preferredLocale);
```

### Pattern 3: Conditional Locale Logic

```java
String locale = dossier.getLocale();
if (locale == null || locale.isEmpty()) {
    locale = localeDetectionService.detectLocaleFromPhone(dossier.getLeadPhone());
    dossier.setLocale(locale);
}
```

## Locale Codes Reference

| Code | Language | Use When |
|------|----------|----------|
| fr_FR | French | France, Belgium, Monaco |
| en_US | English | US, UK, International |
| ar_MA | Arabic | Morocco, Middle East |
| es_ES | Spanish | Spain, Latin America |
| de_DE | German | Germany, Austria |

## Phone Number Detection Examples

| Phone Number | Detected Locale | Why |
|--------------|-----------------|-----|
| +212612345678 | ar_MA | Morocco country code |
| +33612345678 | fr_FR | France country code |
| +1415555000 | en_US | US country code |
| +44207946000 | en_US | UK country code |
| +34612345678 | es_ES | Spain country code |
| +49301234567 | de_DE | Germany country code |

## Debugging

### Check Locale Detection

```java
@Autowired
private LocaleDetectionService localeDetectionService;

String locale = localeDetectionService.detectLocaleFromPhone("+212612345678");
logger.info("Detected locale: {}", locale); // Should be "ar_MA"
```

### Verify Template Exists

```java
try {
    WhatsAppTemplate template = templateService.getLocalizedTemplate("appointment_reminder", "ar_MA");
    logger.info("Found template: {} ({})", template.getName(), template.getLanguage());
} catch (ResourceNotFoundException e) {
    logger.error("No template found for locale ar_MA, check fallback chain");
}
```

### Test Date Formatting

```java
LocalDateTime now = LocalDateTime.now();
Locale locale = new Locale("ar", "MA");
DateTimeFormatter formatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale);
String formatted = now.format(formatter);
logger.info("Formatted date for ar_MA: {}", formatted);
```

## Best Practices

### ✅ DO

- Always provide locale when creating appointments
- Use auto-detection for new dossiers
- Fall back to fr_FR if locale is unknown
- Test RTL rendering for Arabic templates
- Cache localized templates for performance

### ❌ DON'T

- Don't hardcode locale values
- Don't skip fallback chain
- Don't forget to set text_direction for RTL
- Don't assume phone number is always valid
- Don't mix locale codes (use consistent format)

## Testing Checklist

- [ ] Create dossier with French phone (+33) → locale = fr_FR
- [ ] Create dossier with Moroccan phone (+212) → locale = ar_MA
- [ ] Create dossier with US phone (+1) → locale = en_US
- [ ] Create dossier without locale → auto-detects from phone
- [ ] Get localized template for ar_MA → returns Arabic template
- [ ] Get localized template for unsupported locale → falls back to fr_FR
- [ ] Format date for French locale → displays French format
- [ ] Format date for Arabic locale → displays Arabic numerals
- [ ] Submit Arabic template → includes text_direction: RTL
- [ ] Send appointment reminder with ar_MA locale → uses Arabic template

## Troubleshooting

### Template Not Found

**Problem**: `ResourceNotFoundException: Template not found for locale ar_MA`

**Solution**: 
1. Check if translation exists: `SELECT * FROM whatsapp_template WHERE name='appointment_reminder' AND language='ar_MA'`
2. If not, create translation via API
3. Verify fallback chain is working (should fall back to fr_FR)

### Wrong Date Format

**Problem**: Dates showing in wrong format

**Solution**:
1. Verify locale is correctly set on dossier
2. Check `parseLocale()` method is parsing correctly
3. Ensure `DateTimeFormatter` is using correct locale

### RTL Not Working

**Problem**: Arabic text displaying left-to-right

**Solution**:
1. Verify `text_direction: "RTL"` is in template components
2. Check Meta API submission includes RTL metadata
3. Test in actual WhatsApp client (not all previews support RTL)

## Quick Reference

### Import Statements

```java
import com.example.backend.service.LocaleDetectionService;
import com.example.backend.service.WhatsAppTemplateService;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;
```

### Service Injection

```java
@Autowired
private LocaleDetectionService localeDetectionService;

@Autowired
private WhatsAppTemplateService templateService;
```

### Common Operations

```java
// Detect locale
String locale = localeDetectionService.detectLocaleFromPhone(phone);

// Get template
WhatsAppTemplate template = templateService.getLocalizedTemplate(name, locale);

// Format date
Locale javaLocale = parseLocale(locale);
DateTimeFormatter formatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(javaLocale);
String formattedDate = dateTime.format(formatter);

// Check RTL
boolean isRtl = localeDetectionService.isRtlLocale(locale);
```

## Next Steps

1. Read full documentation: `MULTI_LANGUAGE_APPOINTMENT_REMINDER_IMPLEMENTATION.md`
2. Review locale selector component: `LOCALE_SELECTOR_COMPONENT.md`
3. Test with different phone numbers
4. Create template translations for your locales
5. Update UI to show locale information

## Support

For questions or issues:
1. Check the implementation docs
2. Review the API examples
3. Test with the debugging methods above
4. Verify database migration completed successfully
