import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LeadExportDialogComponent } from './lead-export-dialog.component';
import { LeadApiService } from '../services/lead-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

describe('LeadExportDialogComponent', () => {
  let component: LeadExportDialogComponent;
  let fixture: ComponentFixture<LeadExportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadExportDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        LeadApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();
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
