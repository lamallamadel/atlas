import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LeadImportDialogComponent } from './lead-import-dialog.component';
import { LeadApiService } from '../services/lead-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi} from '@angular/common/http';

describe('LeadImportDialogComponent', () => {
  let component: LeadImportDialogComponent;
  let fixture: ComponentFixture<LeadImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadImportDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        LeadApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate CSV file type', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    component['validateAndSetFile'](file);
    expect(component.selectedFile).toBeNull();
  });

  it('should accept CSV file', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component['validateAndSetFile'](file);
    expect(component.selectedFile).toBe(file);
  });

  it('should remove file', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile = file;
    component.removeFile();
    expect(component.selectedFile).toBeNull();
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
  });

  it('should calculate progress percentage', () => {
    component.importResponse = {
      importJobId: 1,
      totalRows: 100,
      successCount: 50,
      errorCount: 25,
      skippedCount: 25,
      validationErrors: []};
    expect(component.getProgressPercentage()).toBe(100);
  });
});
