import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import {} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LeadExportDialogComponent } from './lead-export-dialog.component';
import { LeadApiService } from '../services/lead-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('LeadExportDialogComponent', () => {
  let component: LeadExportDialogComponent;
  let fixture: ComponentFixture<LeadExportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        BrowserAnimationsModule,
        MatDialogModule,

        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDividerModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatProgressBarModule,
        LeadExportDialogComponent,
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
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        LeadApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select all columns', () => {
    component.deselectAllColumns();
    component.selectAllColumns();
    expect(component.columns.every((col) => col.selected)).toBe(true);
  });

  it('should deselect all columns', () => {
    component.selectAllColumns();
    component.deselectAllColumns();
    expect(component.columns.every((col) => !col.selected)).toBe(true);
  });

  it('should count selected columns', () => {
    component.selectAllColumns();
    const count = component.getSelectedColumnsCount();
    expect(count).toBe(component.columns.length);
  });

  it('should allow export when columns are selected', () => {
    component.selectAllColumns();
    expect(component.canExport()).toBe(true);
  });

  it('should not allow export when no columns are selected', () => {
    component.deselectAllColumns();
    expect(component.canExport()).toBe(false);
  });
});
