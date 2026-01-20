import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmptyStateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display message', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.message).toBe('Aucune donnée disponible');
    expect(compiled.querySelector('.empty-state-message')?.textContent).toContain('Aucune donnée disponible');
  });

  it('should display subtext when provided', () => {
    component.subtext = 'Test subtext';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const subtextElement = compiled.querySelector('.empty-state-subtext');
    expect(subtextElement).toBeTruthy();
    expect(subtextElement?.textContent).toContain('Test subtext');
  });

  it('should call primary action handler when primary button clicked', () => {
    const mockHandler = jasmine.createSpy('primaryHandler');
    component.primaryAction = { label: 'Primary', handler: mockHandler };
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary-action') as HTMLButtonElement;
    button.click();
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should call secondary action handler when secondary button clicked', () => {
    const mockHandler = jasmine.createSpy('secondaryHandler');
    component.secondaryAction = { label: 'Secondary', handler: mockHandler };
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-secondary-action') as HTMLButtonElement;
    button.click();
    expect(mockHandler).toHaveBeenCalled();
  });
});
