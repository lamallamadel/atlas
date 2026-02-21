# I18n Quick Reference Guide

## Common Commands

### Frontend (Angular)

```bash
# Extract translatable strings
npm run extract-i18n

# Develop in specific locale
npm run start:fr    # French
npm run start:en    # English  
npm run start:es    # Spanish

# Build for production
npm run build:prod:all          # All locales
npm run build:prod:fr           # French only
npm run build:prod:en           # English only
npm run build:prod:es           # Spanish only
```

## Quick Code Examples

### HTML Template Translation

```html
<!-- Simple text -->
<h1 i18n="@@pageTitle">Dashboard</h1>

<!-- With interpolation -->
<p i18n="@@welcome">Welcome, {{userName}}</p>

<!-- Plural forms -->
<span i18n="@@itemCount">
  {count, plural, =0 {No items} =1 {1 item} other {{{count}} items}}
</span>

<!-- Attributes -->
<button [attr.aria-label]="'Save' | localize" 
        i18n-attr.aria-label="@@saveButton">
  Save
</button>
```

### TypeScript Translation

```typescript
// Simple
title = $localize`:@@myTitle:Welcome`;

// With interpolation
message = $localize`:@@greeting:Hello ${name}`;

// In methods
getMessage() {
  return $localize`:@@errorMsg:An error occurred`;
}
```

### Backend Messages

```java
// Simple message
String msg = i18nService.getMessage("common.save");

// With parameters
String error = i18nService.getMessage(
  "error.notfound.annonce", 
  new Object[]{id}
);

// Success helper
String success = i18nService.getSuccessMessage("created", "Annonce");

// Email subject
String subject = i18nService.getEmailSubject("appointment.confirmation");
```

## Real Estate Terminology Keys

### Property Types
```
realestate.property           = Bien immobilier / Property / Propiedad
realestate.apartment          = Appartement / Apartment / Apartamento  
realestate.house              = Maison / House / Casa
realestate.villa              = Villa / Villa / Villa
realestate.land               = Terrain / Land / Terreno
realestate.commercial         = Commercial / Commercial / Comercial
```

### Transaction Types
```
realestate.sale               = Vente / Sale / Venta
realestate.rent               = Location / Rent / Alquiler
```

### Roles
```
role.buyer                    = Acquéreur / Buyer / Comprador
role.seller                   = Vendeur / Seller / Vendedor
role.tenant                   = Locataire / Tenant / Inquilino
role.landlord                 = Propriétaire / Landlord / Propietario
role.agent                    = Agent immobilier / Real Estate Agent / Agente Inmobiliario
```

### Common UI Elements
```
common.save                   = Enregistrer / Save / Guardar
common.cancel                 = Annuler / Cancel / Cancelar
common.delete                 = Supprimer / Delete / Eliminar
common.edit                   = Modifier / Edit / Editar
common.search                 = Rechercher / Search / Buscar
common.filter                 = Filtrer / Filter / Filtrar
```

## File Locations

### Frontend
```
frontend/src/locale/
├── messages.xlf              # Source (generated)
├── messages.fr.xlf           # French
├── messages.en.xlf           # English
└── messages.es.xlf           # Spanish
```

### Backend
```
backend/src/main/resources/
├── messages.properties       # French (default)
├── messages_en.properties    # English
└── messages_es.properties    # Spanish

backend/src/main/resources/templates/emails/
├── appointment-confirmation_fr.html
├── appointment-confirmation_en.html
└── appointment-confirmation_es.html
```

## Translation ID Conventions

### Format
```
@@scope.context.element
```

### Examples
```
@@dashboard.title                    # Dashboard page title
@@annonce.create.button              # Create button on annonce page
@@dossier.detail.status              # Status field on dossier detail
@@error.notfound.annonce             # Annonce not found error
@@email.subject.appointment          # Email subject
```

## Supported Locales

| Code | Language | Direction | Flag | Market |
|------|----------|-----------|------|--------|
| `fr` | Français | LTR | 🇫🇷 | France (Primary) |
| `en` | English | LTR | 🇬🇧 | International |
| `es` | Español | LTR | 🇪🇸 | Spain, Latin America |
| `ar` | العربية | RTL | 🇸🇦 | Middle East (Prepared) |

## RTL Support

### CSS Classes
```html
<!-- Show only in RTL -->
<div class="rtl-only">Arabic content</div>

<!-- Show only in LTR -->
<div class="ltr-only">English content</div>
```

### Detection
```typescript
// In component
const isRtl = this.i18nService.isRTL();
const direction = this.i18nService.currentDirection; // 'ltr' | 'rtl'
```

## User Preferences API

### Get User Locale
```http
GET /api/user-preferences/locale
Accept-Language: en

Response:
{
  "locale": "en",
  "dateFormat": "MM/dd/yyyy",
  "timeFormat": "hh:mm a",
  "numberFormat": "1,234.56",
  "currency": "EUR"
}
```

### Save User Locale
```http
POST /api/user-preferences/locale
Content-Type: application/json

{
  "locale": "es"
}
```

## Component Usage

### Locale Switcher
```html
<!-- In toolbar or header -->
<app-locale-switcher></app-locale-switcher>
```

Features:
- Flag display
- Native language names
- Persists to backend
- Auto-reload on change

## Common Patterns

### Error Messages
```properties
# Backend: messages.properties
error.validation.required=Le champ {0} est obligatoire
error.notfound.annonce=Annonce introuvable avec l'ID {0}
error.business.duplicate=Un enregistrement avec ces informations existe déjà
```

```java
// Usage
throw new ValidationException(
  i18nService.getMessage("error.validation.required", new Object[]{"Email"})
);
```

### Success Messages
```properties
success.created={0} créé avec succès
success.updated={0} mis à jour avec succès
success.deleted={0} supprimé avec succès
```

```java
// Usage
String msg = i18nService.getSuccessMessage("created", "Annonce");
// Returns: "Annonce créé avec succès"
```

### Email Templates
```java
// Get localized template name
String template = i18nService.getEmailTemplate("appointment-confirmation");
// Returns: "emails/appointment-confirmation_fr" (based on current locale)

// With specific locale
String template = i18nService.getEmailTemplate("appointment-confirmation", Locale.ENGLISH);
// Returns: "emails/appointment-confirmation_en"
```

## Testing Translations

### Visual Testing
```bash
# Start dev server with locale
npm run start:en

# Open http://localhost:4200
# Verify translations
```

### Build Testing
```bash
# Build all locales
npm run build:prod:all

# Check output
ls -la dist/frontend/
# Should show: fr/, en/, es/ directories
```

### Backend Testing
```bash
# Send request with Accept-Language
curl -H "Accept-Language: en" http://localhost:8080/api/annonces

# Or with query param
curl http://localhost:8080/api/annonces?lang=en
```

## Troubleshooting

### Missing Translation Key
```
Error: No translation found for key "myKey"
```
**Fix:** Add key to all XLIFF files

### Build Fails
```
Error: Cannot find translation file
```
**Fix:** Ensure all locale XLIFF files exist in `src/locale/`

### Wrong Locale Displayed
**Fix:** Check browser language settings or user preferences

### RTL Not Applied
**Fix:** Ensure `rtl.scss` is imported in `styles.css`

## Best Practices

✅ **DO:**
- Always use translation IDs (`@@myId`)
- Provide translator context
- Test all locales before release
- Use meaningful key names
- Keep translations in sync

❌ **DON'T:**
- Hardcode user-facing strings
- Concatenate translated strings
- Translate technical codes/IDs
- Forget to extract after adding i18n
- Skip RTL testing for Arabic

## Resources

- [Full Documentation](./I18N_TRANSLATION_MANAGEMENT.md)
- [Angular i18n Guide](https://angular.io/guide/i18n)
- [Spring MessageSource](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/MessageSource.html)
- [XLIFF 2.0 Spec](http://docs.oasis-open.org/xliff/xliff-core/v2.0/xliff-core-v2.0.html)
