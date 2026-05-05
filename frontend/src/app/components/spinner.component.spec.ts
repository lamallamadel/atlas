import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.variant()).toBe('circular');
    expect(component.size()).toBe('md');
    expect(component.color()).toBe('primary');
    expect(component.timeout()).toBe(5000);
    expect(component.showCancelButton()).toBe(false);
  });

  it('should display circular spinner by default', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-circular')).toBeTruthy();
  });

  it('should display linear spinner when variant is linear', () => {
    fixture.componentRef.setInput('variant', 'linear');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-linear')).toBeTruthy();
  });

  it('should display dots spinner when variant is dots', () => {
    fixture.componentRef.setInput('variant', 'dots');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-dots')).toBeTruthy();
  });

  it('should apply size class correctly', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-lg')).toBeTruthy();
  });

  it('should apply color class correctly', () => {
    fixture.componentRef.setInput('color', 'white');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-white')).toBeTruthy();
  });

  it('should display message when provided', () => {
    fixture.componentRef.setInput('message', 'Loading data...');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const messageElement = compiled.querySelector('.spinner-message');
    expect(messageElement).toBeTruthy();
    expect(messageElement.textContent.trim()).toBe('Loading data...');
  });

  it('should display cancel button when showCancelButton is true', () => {
    fixture.componentRef.setInput('showCancelButton', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-cancel-btn')).toBeTruthy();
  });

  it('should emit cancel event when cancel button is clicked', () => {
    fixture.componentRef.setInput('showCancelButton', true);
    fixture.detectChanges();

    vi.spyOn(component.cancelled, 'emit');
    const cancelButton = fixture.nativeElement.querySelector(
      '.spinner-cancel-btn'
    );
    cancelButton.click();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should show timeout message after timeout period', async () => {
    fixture.componentRef.setInput('timeout', 1000);
    fixture.detectChanges();

    expect(component.showTimeoutMessage).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);

    expect(component.showTimeoutMessage).toBe(true);
  });

  it('should emit timeoutReached event after timeout', async () => {
    fixture.componentRef.setInput('timeout', 1000);
    vi.spyOn(component.timeoutReached, 'emit');

    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(1000);

    expect(component.timeoutReached.emit).toHaveBeenCalled();
  });

  it('should clear timeout on destroy', async () => {
    fixture.componentRef.setInput('timeout', 1000);
    fixture.detectChanges();
    component.ngOnDestroy();
    await vi.advanceTimersByTimeAsync(1000);
    expect(component.showTimeoutMessage).toBe(false);
  });

  it('should not set timeout when timeout is 0', () => {
    fixture.componentRef.setInput('timeout', 0);
    fixture.detectChanges();

    expect(component.showTimeoutMessage).toBe(false);
  });

  it('should apply all class combinations correctly', () => {
    fixture.componentRef.setInput('variant', 'dots');
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('color', 'neutral');
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.spinner-container');
    expect(container.classList.contains('spinner-dots')).toBe(true);
    expect(container.classList.contains('spinner-sm')).toBe(true);
    expect(container.classList.contains('spinner-neutral')).toBe(true);
  });
});
