# Locale Selector Component

## Overview

The `LocaleSelectorComponent` is an Angular standalone component that provides a dropdown interface for selecting communication locale in the appointment creation UI.

## Component Code

Create the component at: `frontend/src/app/components/locale-selector/locale-selector.component.ts`

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LocaleOption {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-locale-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="locale-selector">
      <label [for]="inputId" class="locale-label">
        {{ label }}
      </label>
      <select
        [id]="inputId"
        [(ngModel)]="selectedLocale"
        (ngModelChange)="onLocaleChange($event)"
        [disabled]="disabled"
        class="locale-select"
      >
        <option *ngFor="let locale of locales" [value]="locale.code">
          {{ locale.flag }} {{ locale.label }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .locale-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .locale-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #374151;
    }

    .locale-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: white;
      cursor: pointer;
      transition: border-color 0.15s ease-in-out;
    }

    .locale-select:hover:not(:disabled) {
      border-color: #9ca3af;
    }

    .locale-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .locale-select:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class LocaleSelectorComponent {
  @Input() label: string = 'Language / Langue / لغة';
  @Input() selectedLocale: string = 'fr_FR';
  @Input() disabled: boolean = false;
  @Input() inputId: string = 'locale-selector';
  
  @Output() localeChange = new EventEmitter<string>();

  locales: LocaleOption[] = [
    { code: 'fr_FR', label: 'Français', flag: '🇫🇷' },
    { code: 'en_US', label: 'English', flag: '🇬🇧' },
    { code: 'ar_MA', label: 'العربية', flag: '🇲🇦' },
    { code: 'es_ES', label: 'Español', flag: '🇪🇸' },
    { code: 'de_DE', label: 'Deutsch', flag: '🇩🇪' }
  ];

  onLocaleChange(locale: string): void {
    this.localeChange.emit(locale);
  }
}
```

## Unit Test

Create the test file at: `frontend/src/app/components/locale-selector/locale-selector.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocaleSelectorComponent } from './locale-selector.component';

describe('LocaleSelectorComponent', () => {
  let component: LocaleSelectorComponent;
  let fixture: ComponentFixture<LocaleSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocaleSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LocaleSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit locale change event', () => {
    spyOn(component.localeChange, 'emit');
    component.onLocaleChange('en_US');
    expect(component.localeChange.emit).toHaveBeenCalledWith('en_US');
  });

  it('should have default locale as fr_FR', () => {
    expect(component.selectedLocale).toBe('fr_FR');
  });

  it('should have 5 locale options', () => {
    expect(component.locales.length).toBe(5);
  });
});
```

## Usage in Appointment Form

### 1. Import the Component

```typescript
import { LocaleSelectorComponent } from '../components/locale-selector/locale-selector.component';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LocaleSelectorComponent  // Add this
  ],
  // ...
})
export class AppointmentCreateComponent {
  // ...
}
```

### 2. Add to Form

```typescript
appointmentForm = this.fb.group({
  dossierId: ['', Validators.required],
  startTime: ['', Validators.required],
  endTime: ['', Validators.required],
  location: [''],
  assignedTo: [''],
  notes: [''],
  status: ['SCHEDULED'],
  reminderChannels: [['WHATSAPP', 'SMS', 'EMAIL']],
  templateCode: ['appointment_reminder'],
  locale: ['fr_FR']  // Add locale field
});
```

### 3. Add to Template

```html
<form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()">
  <!-- Other form fields -->
  
  <app-locale-selector
    [selectedLocale]="appointmentForm.get('locale')?.value"
    (localeChange)="onLocaleChange($event)"
    label="Communication Language">
  </app-locale-selector>

  <!-- Submit button -->
</form>
```

### 4. Handle Locale Change

```typescript
onLocaleChange(locale: string): void {
  this.appointmentForm.patchValue({ locale });
}
```

## Features

- **Multi-language Support**: Supports fr_FR, en_US, ar_MA, es_ES, de_DE
- **Flag Icons**: Visual flags for better UX
- **Accessible**: Proper label association and keyboard navigation
- **Standalone**: No module dependencies
- **Responsive**: Works on mobile and desktop
- **Disabled State**: Can be disabled when needed

## Integration with Dossier

When creating a new dossier, the locale can also be specified:

```typescript
createDossier(request: DossierCreateRequest): Observable<DossierResponse> {
  // If locale not specified, it will be auto-detected from phone number
  return this.http.post<DossierResponse>('/api/v1/dossiers', request);
}
```

The backend will automatically detect the locale from the phone number if not provided.

## Backend Integration

The locale selector integrates with:

1. **Dossier Creation**: Sets initial locale for communication
2. **Appointment Creation**: Allows override of dossier locale
3. **Template Selection**: Backend uses locale to select appropriate WhatsApp template
4. **Date/Time Formatting**: Backend formats dates according to locale

## Locale Mapping

| Locale Code | Language | Countries |
|-------------|----------|-----------|
| fr_FR | French | France, Belgium, Switzerland, Luxembourg |
| en_US | English | US, UK, Canada, Australia |
| ar_MA | Arabic | Morocco, Saudi Arabia, UAE, Egypt |
| es_ES | Spanish | Spain, Mexico |
| de_DE | German | Germany, Austria, Switzerland |

## Auto-Detection

The backend automatically detects locale from phone numbers:

- **Moroccan numbers** (+212): ar_MA
- **French numbers** (+33): fr_FR
- **US/UK numbers** (+1, +44): en_US
- **Default**: fr_FR (if detection fails)

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- High contrast mode compatible
- Screen reader friendly

## Testing

Run the unit tests:

```bash
cd frontend
npm test -- --include='**/locale-selector.component.spec.ts'
```

## Styling Customization

You can customize the component by overriding CSS classes:

```css
/* In your component's styles */
::ng-deep .locale-select {
  border-color: your-color;
  font-size: your-size;
}
```

Or use CSS variables in the parent component:

```css
.appointment-form {
  --locale-select-border: #your-color;
  --locale-select-focus: #your-focus-color;
}
```
