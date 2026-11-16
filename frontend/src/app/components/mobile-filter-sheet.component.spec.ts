import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MobileFilterSheetComponent } from './mobile-filter-sheet.component';

describe('MobileFilterSheetComponent', () => {
  let component: MobileFilterSheetComponent;
  let fixture: ComponentFixture<MobileFilterSheetComponent>;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  const mockData = {
    filters: {
      status: 'ACTIVE',
      city: 'Paris'},
    config: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }]},
      {
        key: 'city',
        label: 'City',
        type: 'text' as const,
        placeholder: 'Enter city'}]};

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn().mockName('DialogRef.close') };

    await TestBed.configureTestingModule({
      imports: [MobileFilterSheetComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRefSpy },
        { provide: DIALOG_DATA, useValue: mockData }]}).compileComponents();
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
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      action: 'apply',
      filters: component.filters});
  });

  it('should call dismiss with reset action when reset is clicked', () => {
    component.reset();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'reset' });
  });

  it('should call dismiss with cancel action when close is clicked', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
  });
});
