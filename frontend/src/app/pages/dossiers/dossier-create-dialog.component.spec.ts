import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DossierCreateDialogComponent } from './dossier-create-dialog.component';
import { DossierApiService } from '../../services/dossier-api.service';
import { AnnonceApiService } from '../../services/annonce-api.service';

describe('DossierCreateDialogComponent', () => {
  let component: DossierCreateDialogComponent;
  let fixture: ComponentFixture<DossierCreateDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DossierCreateDialogComponent>>;
  let mockDossierApiService: jasmine.SpyObj<DossierApiService>;
  let mockAnnonceApiService: jasmine.SpyObj<AnnonceApiService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDossierApiService = jasmine.createSpyObj('DossierApiService', ['create', 'checkDuplicates']);
    mockAnnonceApiService = jasmine.createSpyObj('AnnonceApiService', ['list']);

    mockAnnonceApiService.list.and.returnValue(of({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true, empty: true } as any));

    await TestBed.configureTestingModule({
      declarations: [ DossierCreateDialogComponent ],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: AnnonceApiService, useValue: mockAnnonceApiService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossierCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.dossierForm.get('leadName')?.value).toBe('');
    expect(component.dossierForm.get('leadPhone')?.value).toBe('');
    expect(component.dossierForm.get('leadSource')?.value).toBe('');
    expect(component.dossierForm.get('annonceId')?.value).toBeNull();
  });

  it('should validate phone pattern', () => {
    const phoneControl = component.dossierForm.get('leadPhone');
    
    phoneControl?.setValue('06 12 34 56 78');
    expect(phoneControl?.valid).toBe(true);
    
    phoneControl?.setValue('invalid');
    expect(phoneControl?.hasError('pattern')).toBe(true);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should submit valid form', () => {
    const mockDossier = { id: 1, leadName: 'Test', leadPhone: '0612345678', status: 'NEW' } as any;
    mockDossierApiService.create.and.returnValue(of(mockDossier));

    component.dossierForm.patchValue({
      leadName: 'Test',
      leadPhone: '0612345678'
    });

    component.onSubmit();

    expect(mockDossierApiService.create).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(mockDossier);
  });

  it('should handle creation error', () => {
    const error = { status: 400, error: { message: 'Error' } };
    mockDossierApiService.create.and.returnValue(throwError(() => error));

    component.dossierForm.patchValue({
      leadName: 'Test',
      leadPhone: '0612345678'
    });

    component.onSubmit();

    expect(component.error).toBe('Error');
    expect(component.submitting).toBe(false);
  });
});
