import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdvancedFiltersDialogComponent } from './advanced-filters-dialog.component';
import { AdvancedFiltersComponent } from './advanced-filters.component';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

describe('AdvancedFiltersDialogComponent', () => {
  let component: AdvancedFiltersDialogComponent;
  let fixture: ComponentFixture<AdvancedFiltersDialogComponent>;

  const mockDialogRef = {
    close: vi.fn()};

  const mockDialogData = {
    filterType: 'DOSSIER',
    fields: []};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdvancedFiltersDialogComponent,
        AdvancedFiltersComponent],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDialogData },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();
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
