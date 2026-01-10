import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MobileFilterSheetComponent } from './mobile-filter-sheet.component';

describe('MobileFilterSheetComponent', () => {
  let component: MobileFilterSheetComponent;
  let fixture: ComponentFixture<MobileFilterSheetComponent>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef<MobileFilterSheetComponent>>;

  const mockData = {
    filters: {
      status: 'ACTIVE',
      city: 'Paris'
    },
    config: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ]
      },
      {
        key: 'city',
        label: 'City',
        type: 'text' as const,
        placeholder: 'Enter city'
      }
    ]
  };

  beforeEach(async () => {
    const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

    await TestBed.configureTestingModule({
      declarations: [MobileFilterSheetComponent],
      imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatBottomSheetRef, useValue: bottomSheetRefSpy },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: mockData }
      ]
    }).compileComponents();

    bottomSheetRef = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef<MobileFilterSheetComponent>>;
    fixture = TestBed.createComponent(MobileFilterSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided filter data', () => {
    expect(component.filters['status']).toBe('ACTIVE');
    expect(component.filters['city']).toBe('Paris');
  });

  it('should call dismiss with apply action when apply is clicked', () => {
    component.apply();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith({
      action: 'apply',
      filters: component.filters
    });
  });

  it('should call dismiss with reset action when reset is clicked', () => {
    component.reset();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith({ action: 'reset' });
  });

  it('should call dismiss with cancel action when close is clicked', () => {
    component.close();
    expect(bottomSheetRef.dismiss).toHaveBeenCalledWith({ action: 'cancel' });
  });
});
