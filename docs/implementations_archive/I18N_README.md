# Internationalization (i18n) - Real Estate CRM

## Quick Start

### Development

```bash
# Start development server in French (default)
cd frontend
npm start

# Start in specific language
npm run start:fr    # French
npm run start:en    # English
npm run start:es    # Spanish

# Extract translatable strings
npm run extract-i18n
```

### Production Build

```bash
# Build all locales
npm run build:prod:all

# Build specific locale
npm run build:prod:fr
npm run build:prod:en
npm run build:prod:es
```

## Supported Languages

| Language | Code | Market | Status |
|----------|------|--------|--------|
| 🇫🇷 French | `fr` | France (Primary) | ✅ Complete |
| 🇬🇧 English | `en` | International | ✅ Complete |
| 🇪🇸 Spanish | `es` | Spain, LatAm | ✅ Complete |
| 🇸🇦 Arabic | `ar` | Middle East | 🔧 Prepared (RTL) |

## Key Features

✅ **Compile-Time Translation** - Angular i18n with XLIFF 2.0  
✅ **Runtime Locale Switching** - User preference persistence  
✅ **Industry Terminology** - Real estate-specific translations  
✅ **RTL Support** - Ready for Arabic markets  
✅ **Backend i18n** - Spring MessageSource for API/emails  
✅ **Email Templates** - Localized per language  
✅ **Date/Number Formats** - Locale-appropriate formatting  

## Usage in Code

### HTML Templates

```html
<!-- Simple translation -->
<h1 i18n="@@pageTitle">Dashboard</h1>

<!-- With interpolation -->
<p i18n="@@welcome">Welcome, {{userName}}</p>

<!-- Pluralization -->
<span i18n="@@propertyCount">
  {count, plural, =0 {No properties} =1 {1 property} other {{{count}} properties}}
</span>

<!-- Attribute translation -->
<button [attr.aria-label]="'Save' | localize" i18n-attr.aria-label="@@saveButton">
  Save
</button>
```

### TypeScript

```typescript
// In component/service
title = $localize`:@@myTitle:Welcome`;
message = $localize`:@@greeting:Hello ${name}`;

// Using I18nService
constructor(private i18n: I18nService) {
  const locale = this.i18n.currentLocale;
  const isRtl = this.i18n.isRTL();
}
```

### Backend Java

```java
@Service
public class MyService {
    @Autowired
    private I18nService i18n;
    
    public void example() {
        // Get localized message
        String msg = i18n.getMessage("common.save");
        
        // With parameters
        String error = i18n.getMessage(
            "error.notfound.annonce", 
            new Object[]{id}
        );
        
        // Email template
        String template = i18n.getEmailTemplate("appointment-confirmation");
    }
}
```

## Real Estate Terminology

Pre-translated terms for the real estate industry:

### Property Types
- **Annonce** / Listing / Anuncio
- **Appartement** / Apartment / Apartamento
- **Maison** / House / Casa
- **Villa** / Villa / Villa
- **Terrain** / Land / Terreno

### Roles
- **Acquéreur** / Buyer / Comprador
- **Vendeur** / Seller / Vendedor
- **Agent immobilier** / Real Estate Agent / Agente Inmobiliario

### Common Terms
- **À vendre** / For Sale / En Venta
- **À louer** / For Rent / En Alquiler
- **Rendez-vous** / Appointment / Cita
- **Visite** / Viewing / Visita
- **Commission** / Commission / Comisión

## Locale Switcher

Use the built-in locale switcher component:

```html
<app-locale-switcher></app-locale-switcher>
```

Features:
- Flag and native language name display
- Saves preference to backend
- Auto-reloads app with new locale

## File Structure

```
frontend/src/
├── locale/
│   ├── messages.fr.xlf     # French translations
│   ├── messages.en.xlf     # English translations
│   └── messages.es.xlf     # Spanish translations
├── app/
│   ├── services/
│   │   └── i18n.service.ts
│   └── components/
│       └── locale-switcher.component.ts
└── styles/
    └── rtl.scss            # RTL language support

backend/src/main/resources/
├── messages.properties       # French (default)
├── messages_en.properties    # English
├── messages_es.properties    # Spanish
├── messages_ar.properties    # Arabic (prepared)
└── templates/emails/
    ├── appointment-confirmation_fr.html
    ├── appointment-confirmation_en.html
    └── appointment-confirmation_es.html
```

## Workflow

1. **Add translations in templates**
   ```html
   <span i18n="@@myKey">My text</span>
   ```

2. **Extract messages**
   ```bash
   npm run extract-i18n
   ```

3. **Translate in XLIFF files**
   - Edit `src/locale/messages.{locale}.xlf`
   - Update `<target>` elements

4. **Test**
   ```bash
   npm run start:en
   ```

5. **Build for production**
   ```bash
   npm run build:prod:all
   ```

## API Endpoints

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

## RTL Language Support

The application is prepared for RTL languages (Arabic):

```scss
// Automatically applied when locale is RTL
body.rtl {
  direction: rtl;
  text-align: right;
  // All Material components adjusted
  // Icons flipped appropriately
}
```

## Documentation

📚 **Full Documentation**: [I18N_TRANSLATION_MANAGEMENT.md](docs/I18N_TRANSLATION_MANAGEMENT.md)  
📖 **Quick Reference**: [I18N_QUICK_REFERENCE.md](docs/I18N_QUICK_REFERENCE.md)  
📋 **Implementation Summary**: [I18N_IMPLEMENTATION_SUMMARY.md](I18N_IMPLEMENTATION_SUMMARY.md)

## Best Practices

✅ **DO:**
- Always provide translation IDs (`@@myId`)
- Use meaningful ID names
- Test all locales before deploying
- Provide context for translators

❌ **DON'T:**
- Hardcode user-facing strings
- Concatenate translated strings
- Translate technical codes/IDs
- Skip RTL testing

## Support & Maintenance

### Adding a New Language

1. Update `angular.json` with new locale
2. Create `messages.{locale}.xlf` file
3. Add to `I18nService.supportedLocales`
4. Create backend `messages_{locale}.properties`
5. Create email templates `*_{locale}.html`
6. Test and deploy

### Translation Tools

- **Poedit** - Free XLIFF editor
- **Lokalise** - Team collaboration
- **Crowdin** - Translation management
- **VS Code** - Angular XLIFF Editor extension

## Production Deployment

Production builds create locale-specific bundles:

```
dist/frontend/
├── fr/           # French (default)
│   ├── index.html
│   └── *.js
├── en/           # English
│   ├── index.html
│   └── *.js
└── es/           # Spanish
    ├── index.html
    └── *.js
```

Configure your web server to serve the appropriate locale based on URL path.

## Questions?

- Review the full documentation in `docs/`
- Check code examples in translation files
- Contact the development team

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024  
**Maintained By**: Development Team
