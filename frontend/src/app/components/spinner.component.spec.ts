import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinnerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.variant).toBe('circular');
    expect(component.size).toBe('md');
    expect(component.color).toBe('primary');
    expect(component.timeout).toBe(5000);
    expect(component.showCancelButton).toBe(false);
  });

  it('should display circular spinner by default', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-circular')).toBeTruthy();
  });

  it('should display linear spinner when variant is linear', () => {
    component.variant = 'linear';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-linear')).toBeTruthy();
  });

  it('should display dots spinner when variant is dots', () => {
    component.variant = 'dots';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-dots')).toBeTruthy();
  });

  it('should apply size class correctly', () => {
    component.size = 'lg';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-lg')).toBeTruthy();
  });

  it('should apply color class correctly', () => {
    component.color = 'white';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-white')).toBeTruthy();
  });

  it('should display message when provided', () => {
    component.message = 'Loading data...';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const messageElement = compiled.querySelector('.spinner-message');
    expect(messageElement).toBeTruthy();
    expect(messageElement.textContent.trim()).toBe('Loading data...');
  });

  it('should display cancel button when showCancelButton is true', () => {
    component.showCancelButton = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.spinner-cancel-btn')).toBeTruthy();
  });

  it('should emit cancel event when cancel button is clicked', () => {
    component.showCancelButton = true;
    fixture.detectChanges();
    
    spyOn(component.cancel, 'emit');
    const cancelButton = fixture.nativeElement.querySelector('.spinner-cancel-btn');
    cancelButton.click();
    
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should show timeout message after timeout period', fakeAsync(() => {
    component.timeout = 1000;
    fixture.detectChanges();
    
    expect(component.showTimeoutMessage).toBe(false);
    
    tick(1000);
    
    expect(component.showTimeoutMessage).toBe(true);
  }));

  it('should emit timeoutReached event after timeout', fakeAsync(() => {
    component.timeout = 1000;
    spyOn(component.timeoutReached, 'emit');
    
    fixture.detectChanges();
    tick(1000);
    
    expect(component.timeoutReached.emit).toHaveBeenCalled();
  }));

  it('should clear timeout on destroy', fakeAsync(() => {
    component.timeout = 1000;
    fixture.detectChanges();
    component.ngOnDestroy();
    tick(1000);
    expect(component.showTimeoutMessage).toBe(false);
  }));

  it('should not set timeout when timeout is 0', () => {
    component.timeout = 0;
    fixture.detectChanges();
    
    expect(component.showTimeoutMessage).toBe(false);
  });

  it('should apply all class combinations correctly', () => {
    component.variant = 'dots';
    component.size = 'sm';
    component.color = 'neutral';
    fixture.detectChanges();
    
    const container = fixture.nativeElement.querySelector('.spinner-container');
    expect(container.classList.contains('spinner-dots')).toBe(true);
    expect(container.classList.contains('spinner-sm')).toBe(true);
    expect(container.classList.contains('spinner-neutral')).toBe(true);
  });
});
