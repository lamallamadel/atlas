import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let component: ProgressBarComponent;
  let fixture: ComponentFixture<ProgressBarComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, ProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display progress bar when isNavigating is false', () => {
    fixture.componentRef.setInput('isNavigating', false);
    fixture.detectChanges();

    const progressBarContainer = fixture.nativeElement.querySelector(
      '.progress-bar-container'
    );
    expect(progressBarContainer).toBeNull();
  });

  it('should display progress bar when isNavigating is true', () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    const progressBarContainer = fixture.nativeElement.querySelector(
      '.progress-bar-container'
    );
    expect(progressBarContainer).toBeTruthy();
  });

  it('should start progress when navigation begins', async () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    expect(component.progress).toBe(0);

    await vi.advanceTimersByTimeAsync(200);
    expect(component.progress).toBeGreaterThan(0);
    expect(component.progress).toBeLessThan(90);
  });

  it('should complete progress when navigation ends', async () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(200);

    fixture.componentRef.setInput('isNavigating', false);
    fixture.detectChanges();

    expect(component.progress).toBe(100);

    await vi.advanceTimersByTimeAsync(200);
    expect(component.progress).toBe(0);
  });

  it('should not exceed 90% progress during navigation', async () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    for (let i = 0; i < 50; i++) {
      await vi.advanceTimersByTimeAsync(200);
    }

    expect(component.progress).toBeLessThanOrEqual(90);
  });

  it('should clear interval on component destroy', () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    component.ngOnDestroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should apply correct styles for progress bar', () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();

    component.progress = 50;
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('.progress-bar');
    expect(progressBar).toBeTruthy();
    expect(progressBar.style.width).toBe('50%');
  });
});
