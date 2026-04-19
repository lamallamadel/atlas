# Translation Management Workflow

## Overview

This document describes the comprehensive internationalization (i18n) infrastructure for the real estate CRM application, covering both frontend (Angular) and backend (Spring Boot) translation management.

## Supported Languages

### Primary Markets
- **French (fr)** - Primary language, default
- **English (en)** - International markets
- **Spanish (es)** - Spanish real estate markets

### Future Markets (Prepared)
- **Arabic (ar)** - RTL language support prepared for Middle East markets

## Frontend (Angular) Internationalization

### Technology Stack
- **@angular/localize** - Official Angular i18n library
- **XLIFF 2.0** - Translation file format
- Runtime locale switching with user preferences persistence

### Quick Start Commands

```bash
# Extract translatable strings to XLIFF file
npm run extract-i18n

# Serve application in specific locale
npm run start:fr   # French (default)
npm run start:en   # English
npm run start:es   # Spanish

# Build for production - all locales
npm run build:prod:all

# Build for specific locale
npm run build:prod:fr
npm run build:prod:en
npm run build:prod:es
```

### Translation File Locations

```
frontend/src/locale/
├── messages.xlf       # Source file (generated)
├── messages.fr.xlf    # French translations
├── messages.en.xlf    # English translations
└── messages.es.xlf    # Spanish translations
```

### Adding Translatable Content

#### In HTML Templates

```html
<!-- Simple text translation -->
<h1 i18n="@@pageTitle">Dashboard</h1>

<!-- With description for translators -->
<p i18n="Welcome message|Greeting shown to users@@welcomeMessage">
  Welcome to our real estate platform
</p>

<!-- With placeholders -->
<span i18n="@@propertyPrice">Price: {price, number, '1.2-2'} €</span>

<!-- Attribute translation -->
<button [attr.aria-label]="'Close dialog' | localize"
        i18n-attr.aria-label="@@closeDialogLabel">
  Close
</button>

<!-- ICU Message Format for plurals -->
<span i18n="@@bedroomCount">
  {bedrooms, plural, =0 {No bedrooms} =1 {1 bedroom} other {{{bedrooms}} bedrooms}}
</span>
```

#### In TypeScript Code

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  `
})
export class ExampleComponent {
  title = $localize`:@@exampleTitle:Property Listings`;
  description = $localize`:@@exampleDesc:Browse our available properties`;
  
  // With interpolation
  getMessage(count: number) {
    return $localize`:@@propertyCount:Found ${count} properties`;
  }
}
```

### Real Estate Domain Terminology

Key real estate terms are pre-translated in the system:

#### Property Types
- **Annonce/Listing** - Property listing
- **Appartement/Apartment** - Apartment
- **Maison/House** - House
- **Villa/Villa** - Villa
- **Terrain/Land** - Land
- **Commercial** - Commercial property

#### Transaction Types
- **Vente/Sale** - For sale
- **Location/Rent** - For rent

#### Roles
- **Acquéreur/Buyer** - Property buyer
- **Vendeur/Seller** - Property seller
- **Locataire/Tenant** - Tenant
- **Propriétaire/Landlord** - Landlord
- **Agent immobilier/Real Estate Agent** - Agent

#### Measurements
- **m²** - Square meters (consistent across all languages)
- **Chambres/Bedrooms** - Bedrooms
- **Salles de bain/Bathrooms** - Bathrooms

### Locale Switching Component

The `LocaleSwitcherComponent` provides runtime language switching:

```typescript
// Usage in toolbar/header
<app-locale-switcher></app-locale-switcher>
```

Features:
- Displays current language flag and icon
- Shows all available locales with native names
- Persists user preference to backend
- Automatically reloads application with new locale
- Supports RTL language detection

### User Locale Preferences

User preferences are persisted to the backend and include:

```typescript
interface UserLocalePreference {
  locale: string;           // fr, en, es, ar
  dateFormat: string;       // dd/MM/yyyy or MM/dd/yyyy
  timeFormat: string;       // HH:mm or hh:mm a
  numberFormat: string;     // 1 234,56 or 1,234.56
  currency: string;         // EUR, USD, etc.
}
```

### Translation Workflow

1. **Developer marks strings for translation**
   ```bash
   # Add i18n attributes to templates
   # Use $localize in TypeScript
   ```

2. **Extract messages**
   ```bash
   npm run extract-i18n
   # Generates src/locale/messages.xlf
   ```

3. **Create/update translation files**
   ```bash
   # Copy messages.xlf to messages.{locale}.xlf
   cp src/locale/messages.xlf src/locale/messages.en.xlf
   ```

4. **Translate content**
   - Open XLIFF file in translation editor
   - Update `<target>` elements with translations
   - Maintain placeholder syntax: `{0}`, `{propertyName}`

5. **Test translations**
   ```bash
   npm run start:en
   # Verify translations in browser
   ```

6. **Build for production**
   ```bash
   npm run build:prod:all
   # Creates separate bundles for each locale
   ```

### XLIFF File Structure

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="fr">
  <file id="ngi18n" original="ng.template">
    <unit id="propertyTitle">
      <segment>
        <source>Property</source>
        <target>Bien immobilier</target>
      </segment>
    </unit>
    
    <unit id="priceWithValue">
      <segment>
        <source>Price: {price} €</source>
        <target>Prix : {price} €</target>
      </segment>
    </unit>
  </file>
</xliff>
```

## Backend (Spring Boot) Internationalization

### Technology Stack
- **Spring MessageSource** - Message resolution
- **ResourceBundle** - Properties file management
- **Accept-Language header** - Locale detection
- **LocaleChangeInterceptor** - Runtime locale switching

### Message File Locations

```
backend/src/main/resources/
├── messages.properties       # Default (French)
├── messages_en.properties    # English
└── messages_es.properties    # Spanish
```

### Message Properties Structure

```properties
# Error Messages
error.validation.required=Le champ {0} est obligatoire
error.notfound.annonce=Annonce introuvable avec l'ID {0}

# Success Messages
success.created={0} créé avec succès

# Email Subjects
email.subject.appointment.confirmation=Confirmation de rendez-vous

# Domain Terms
realestate.property=Bien immobilier
realestate.sale=Vente
feature.balcony=Balcon
```

### Using Messages in Java Code

```java
@Service
public class ExampleService {
    
    private final I18nService i18nService;
    
    // Simple message
    String message = i18nService.getMessage("common.save");
    
    // With parameters
    String error = i18nService.getMessage("error.notfound.annonce", new Object[]{annonceId});
    
    // Success message helper
    String success = i18nService.getSuccessMessage("created", "Annonce");
    
    // Email subject
    String subject = i18nService.getEmailSubject("appointment.confirmation");
    
    // Current locale
    Locale locale = i18nService.getCurrentLocale();
    
    // Check if RTL
    boolean isRtl = i18nService.isRTL();
}
```

### Email Template Localization

Email templates are stored per locale:

```
backend/src/main/resources/templates/emails/
├── appointment-confirmation_fr.html
├── appointment-confirmation_en.html
└── appointment-confirmation_es.html
```

Using localized email templates:

```java
@Service
public class EmailService {
    
    private final I18nService i18nService;
    
    public void sendAppointmentConfirmation(Appointment appointment) {
        Locale locale = getUserLocale();
        
        // Get localized template
        String template = i18nService.getEmailTemplate("appointment-confirmation", locale);
        
        // Get localized subject
        String subject = i18nService.getMessage("email.subject.appointment.confirmation", null, locale);
        
        // Send email...
    }
}
```

### API Locale Handling

Clients can specify locale via:

1. **Accept-Language header**
   ```http
   GET /api/annonces
   Accept-Language: en-US,en;q=0.9,fr;q=0.8
   ```

2. **Query parameter**
   ```http
   GET /api/annonces?lang=en
   ```

3. **User preferences** (stored in database)
   ```java
   // Automatically loaded from user preferences
   ```

### Error Message Localization

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private final I18nService i18nService;
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        String message = i18nService.getMessage(
            "error.notfound." + ex.getResourceType(),
            new Object[]{ex.getResourceId()}
        );
        
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(message));
    }
}
```

## RTL (Right-to-Left) Language Support

### CSS RTL Implementation

The application is prepared for Arabic and other RTL languages:

```scss
// Automatic RTL styles applied when dir="rtl"
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

body.rtl {
  // Margins and padding flipped
  .ml-3 { margin-right: 1rem !important; }
  .mr-3 { margin-left: 1rem !important; }
  
  // Text alignment
  .text-left { text-align: right !important; }
  
  // Icons flipped
  .mat-icon.arrow_forward { transform: scaleX(-1); }
}
```

### RTL Detection

```typescript
// I18nService automatically detects RTL
const isRtl = this.i18nService.isRTL();

// Apply to document
document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
```

### RTL-Specific Components

```html
<!-- Show only in RTL mode -->
<div class="rtl-only">محتوى العربي</div>

<!-- Show only in LTR mode -->
<div class="ltr-only">English content</div>
```

## Best Practices

### DO ✅

1. **Always provide translation IDs**
   ```html
   <h1 i18n="@@dashboardTitle">Dashboard</h1>
   ```

2. **Use meaningful IDs**
   ```html
   <p i18n="@@propertyListEmptyState">No properties found</p>
   ```

3. **Extract common terms to reusable keys**
   ```properties
   common.save=Enregistrer
   common.cancel=Annuler
   ```

4. **Test all locales before deployment**
   ```bash
   npm run build:prod:all
   ```

5. **Provide context for translators**
   ```html
   <span i18n="Appointment status badge|Shows current status@@appointmentStatus">
     Confirmed
   </span>
   ```

### DON'T ❌

1. **Avoid hardcoded strings**
   ```typescript
   // Bad
   const message = "Property created";
   
   // Good
   const message = $localize`:@@propertyCreated:Property created`;
   ```

2. **Don't concatenate translated strings**
   ```typescript
   // Bad
   const fullMessage = $localize`:@@hello:Hello` + " " + userName;
   
   // Good
   const fullMessage = $localize`:@@helloUser:Hello ${userName}`;
   ```

3. **Don't translate technical IDs or codes**
   ```properties
   # Bad
   status.NEW=Nouveau
   
   # Good - Use separate display labels
   status.display.NEW=Nouveau
   ```

## Translation Tools

### Recommended XLIFF Editors

1. **Poedit** - Free, supports XLIFF
   - Download: https://poedit.net/

2. **Lokalise** - Team collaboration platform
   - Web-based, supports XLIFF import/export

3. **Crowdin** - Translation management system
   - Supports XLIFF, has API integration

4. **VS Code Extension**
   - "Angular XLIFF Editor" extension

### Automated Translation Services

Consider integrating with:
- Google Cloud Translation API
- Microsoft Translator
- DeepL API (recommended for real estate terminology)

## Deployment Strategy

### Multi-Locale Build

Production builds create separate bundles per locale:

```
dist/frontend/
├── fr/               # French bundle (default)
│   ├── index.html
│   └── *.js
├── en/               # English bundle
│   ├── index.html
│   └── *.js
└── es/               # Spanish bundle
    ├── index.html
    └── *.js
```

### Server Configuration

#### Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        # Default to French
        root /var/www/app/fr;
        try_files $uri $uri/ /index.html;
    }
    
    location /en/ {
        alias /var/www/app/en/;
        try_files $uri $uri/ /en/index.html;
    }
    
    location /es/ {
        alias /var/www/app/es/;
        try_files $uri $uri/ /es/index.html;
    }
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName example.com
    DocumentRoot /var/www/app/fr
    
    Alias /en /var/www/app/en
    Alias /es /var/www/app/es
    
    <Directory /var/www/app>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## Maintenance

### Adding a New Language

1. **Update Angular configuration**
   ```json
   // angular.json
   "i18n": {
     "locales": {
       "de": {
         "translation": "src/locale/messages.de.xlf",
         "baseHref": "/de/"
       }
     }
   }
   ```

2. **Create translation file**
   ```bash
   cp src/locale/messages.xlf src/locale/messages.de.xlf
   # Translate content
   ```

3. **Add locale to supported list**
   ```typescript
   // i18n.service.ts
   public readonly supportedLocales = [
     // ... existing locales
     { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' }
   ];
   ```

4. **Create backend messages file**
   ```properties
   # messages_de.properties
   ```

5. **Create email templates**
   ```html
   <!-- appointment-confirmation_de.html -->
   ```

## Quality Assurance

### Translation Checklist

- [ ] All user-facing strings are marked for translation
- [ ] Translation IDs are unique and meaningful
- [ ] Placeholders are correctly positioned in target strings
- [ ] Plural forms are handled correctly
- [ ] Date, time, and number formats are locale-appropriate
- [ ] Email templates exist for all locales
- [ ] RTL styles tested (if applicable)
- [ ] All locales build successfully
- [ ] Visual inspection in each locale

### Testing

```bash
# Test extraction
npm run extract-i18n

# Test each locale
npm run start:fr
npm run start:en
npm run start:es

# Test production build
npm run build:prod:all
```

## Support

For questions or issues with translations:
- Check this documentation
- Review existing translation files for examples
- Contact the development team
- Submit translation corrections via pull request
