import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AdvancedFiltersDialogComponent } from './advanced-filters-dialog.component';
import { AdvancedFiltersComponent } from './advanced-filters.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('AdvancedFiltersDialogComponent', () => {
  let component: AdvancedFiltersDialogComponent;
  let fixture: ComponentFixture<AdvancedFiltersDialogComponent>;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockDialogData = {
    filterType: 'DOSSIER',
    fields: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatDialogModule,

        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        AdvancedFiltersDialogComponent,
        AdvancedFiltersComponent,
      ],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: () => ({
              onAction: () => of(null),
              afterDismissed: () => of(null),
            }),
            dismiss: () => {},
          },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvancedFiltersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
