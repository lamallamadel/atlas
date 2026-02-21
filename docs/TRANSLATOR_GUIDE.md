# Guide for Translators - Real Estate CRM

## Welcome

Thank you for helping translate our real estate CRM application. This guide will help you understand the context and provide accurate, professional translations.

## About the Application

This is a **Customer Relationship Management (CRM) system** specifically designed for **real estate agencies** and professionals. It helps real estate agents:

- Manage property listings (apartments, houses, villas, land)
- Track leads and client dossiers
- Schedule property viewings and appointments
- Handle offers and contracts
- Communicate with buyers, sellers, tenants, and landlords

## Target Markets

- **French** (fr) - France, French-speaking countries - PRIMARY MARKET
- **English** (en) - International markets, United States, UK
- **Spanish** (es) - Spain, Latin America
- **Arabic** (ar) - Middle East (prepared, not yet active)

## Real Estate Terminology

### Critical Terms to Know

These terms have specific meanings in real estate and should be translated consistently:

#### Property Types
- **Annonce** → Listing/Advertisement for a property
- **Appartement** → Apartment/Flat
- **Maison** → House (detached or semi-detached)
- **Villa** → Villa/Luxury house
- **Terrain** → Land/Plot
- **Commercial** → Commercial property (office, retail)

#### Transaction Types
- **Vente** → Sale
- **Location** → Rent/Lease
- **À vendre** → For Sale
- **À louer** → For Rent

#### Stakeholders
- **Acquéreur** → Buyer (person buying property)
- **Vendeur** → Seller (person selling property)
- **Locataire** → Tenant (person renting)
- **Propriétaire** → Landlord/Owner
- **Agent immobilier** → Real Estate Agent/Realtor
- **Notaire** → Notary (legal professional for property transactions)

#### Property Features
- **Chambres** → Bedrooms
- **Salles de bain** → Bathrooms
- **Surface habitable** → Living area
- **m²** → Square meters (keep as "m²" in all languages)
- **Balcon** → Balcony
- **Terrasse** → Terrace/Patio
- **Jardin** → Garden/Yard
- **Piscine** → Swimming pool
- **Parking** → Parking space
- **Ascenseur** → Elevator/Lift

#### Process Terms
- **Rendez-vous** → Appointment
- **Visite** → Viewing/Property showing
- **Offre** → Offer (on a property)
- **Contrat** → Contract
- **Compromis de vente** → Sales agreement
- **Mandat** → Listing agreement
- **Commission** → Commission/Fee

## Translation Guidelines

### 1. Tone and Style

✅ **Professional but friendly**
- Use formal/professional language for business contexts
- Keep a helpful, approachable tone for user messages
- Be clear and concise

❌ **Avoid**
- Overly casual language
- Technical jargon without context
- Unnecessarily complex sentences

### 2. Consistency

✅ **Be consistent with**
- Terminology throughout the application
- Button labels (Save, Cancel, Delete, etc.)
- Status labels (New, Active, Completed, etc.)
- Error messages format

✅ **Reuse translations**
- Check if a term has already been translated
- Use the same translation for the same concept

### 3. Context Awareness

Consider WHO will see the message:
- **Real estate agents** - Professional, business context
- **Clients (buyers/sellers)** - Clear, reassuring
- **System administrators** - Technical but precise

### 4. Placeholders

**IMPORTANT**: Always preserve placeholders exactly as they appear!

```
Source: "Property {0} has been created"
Correct: "La propriété {0} a été créée"
Wrong: "La propriété a été créée" ❌ (missing {0})
```

Common placeholder formats:
- `{0}`, `{1}`, `{2}` - Positional parameters
- `{propertyName}` - Named parameters
- `{{count}}` - Angular interpolation
- `<strong>`, `<br/>` - HTML tags (keep them!)

### 5. Plural Forms

Some languages have different plural rules. Follow your language's conventions:

**English example**:
```
{count, plural, 
  =0 {No properties} 
  =1 {1 property} 
  other {{{count}} properties}}
```

**Spanish example**:
```
{count, plural, 
  =0 {Sin propiedades} 
  =1 {1 propiedad} 
  other {{{count}} propiedades}}
```

### 6. Date and Time Formats

Use your locale's standard format:
- **French**: dd/MM/yyyy, HH:mm (24-hour)
- **English (US)**: MM/dd/yyyy, hh:mm a (12-hour)
- **Spanish**: dd/MM/yyyy, HH:mm (24-hour)

### 7. Units of Measurement

- **m²** - Keep as "m²" in all languages
- **€** - Euro symbol, position varies by locale
  - French: "350 000 €"
  - English: "€350,000"
  - Spanish: "350.000 €"

## Working with XLIFF Files

### File Structure

```xml
<unit id="propertyCreated">
  <segment>
    <source>Property created successfully</source>
    <target>Propiedad creada con éxito</target>
  </segment>
</unit>
```

- **id**: Unique identifier (don't change)
- **source**: Original French text (don't change)
- **target**: YOUR TRANSLATION goes here

### Translation ID Meanings

IDs follow this pattern: `scope.context.element`

Examples:
- `dashboard.title` → Title of the dashboard page
- `annonce.create.button` → Create button on property listing page
- `error.notfound.annonce` → Error when property not found
- `email.subject.appointment` → Email subject for appointments

### Tools

**Recommended editors**:
1. **Poedit** (Free) - https://poedit.net/
   - Download and open .xlf files
   - See source and target side-by-side
   - Validates format automatically

2. **Lokalise** (Web-based)
   - Collaborative translation platform
   - Shows context and screenshots
   - Translation memory

3. **VS Code** with "Angular XLIFF Editor" extension
   - For developers comfortable with code editors

## Common UI Elements

### Buttons
```
Save → Enregistrer (fr) / Save (en) / Guardar (es)
Cancel → Annuler (fr) / Cancel (en) / Cancelar (es)
Delete → Supprimer (fr) / Delete (en) / Eliminar (es)
Edit → Modifier (fr) / Edit (en) / Editar (es)
Create → Créer (fr) / Create (en) / Crear (es)
```

### Status Values
```
New → Nouveau (fr) / New (en) / Nuevo (es)
Active → Actif (fr) / Active (en) / Activo (es)
Pending → En attente (fr) / Pending (en) / Pendiente (es)
Completed → Terminé (fr) / Completed (en) / Completado (es)
Cancelled → Annulé (fr) / Cancelled (en) / Cancelado (es)
```

### Form Labels
```
Email → Email (fr) / Email (en) / Correo electrónico (es)
Phone → Téléphone (fr) / Phone (en) / Teléfono (es)
Address → Adresse (fr) / Address (en) / Dirección (es)
Price → Prix (fr) / Price (en) / Precio (es)
Description → Description (fr) / Description (en) / Descripción (es)
```

## Error Messages

### Format
Error messages should be:
- Clear about what went wrong
- Actionable (tell user how to fix)
- Professional but not alarming

**Example**:
```
Source (fr): "Le champ email est obligatoire"
English: "Email field is required"
Spanish: "El campo de correo electrónico es obligatorio"
```

### Success Messages

Keep them positive and confirming:
```
Source (fr): "Annonce créée avec succès"
English: "Listing created successfully"
Spanish: "Anuncio creado con éxito"
```

## Email Templates

Email templates have special considerations:

### Greeting
```
French: "Bonjour {0},"
English: "Hello {0},"
Spanish: "Hola {0},"
```

### Closing
```
French: "Cordialement,"
English: "Best regards," or "Sincerely,"
Spanish: "Saludos cordiales," or "Atentamente,"
```

### Subject Lines
Keep concise but descriptive:
```
French: "Confirmation de rendez-vous"
English: "Appointment Confirmation"
Spanish: "Confirmación de Cita"
```

## Quality Checklist

Before submitting translations, verify:

- [ ] All `<target>` elements are filled
- [ ] Placeholders are preserved: `{0}`, `{propertyName}`, etc.
- [ ] HTML tags are kept: `<strong>`, `<br/>`, etc.
- [ ] Terminology is consistent throughout
- [ ] Plural forms follow your language's rules
- [ ] Tone is appropriate (professional but friendly)
- [ ] No typos or grammar errors
- [ ] Translations fit in UI (not too long)
- [ ] Real estate terms are accurate

## Questions?

If you're unsure about:
- **Context**: Ask for screenshots or descriptions
- **Terminology**: Consult local real estate websites
- **Technical terms**: Ask the development team
- **Cultural adaptation**: Consider local market practices

## Thank You!

Your translations help real estate professionals serve their clients better. Quality translations improve user experience and help the business grow in new markets.

---

**For Support**: Contact the development team  
**Documentation**: See `I18N_TRANSLATION_MANAGEMENT.md` for technical details  
**Updates**: Check translation files regularly for new strings
