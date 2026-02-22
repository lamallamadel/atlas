import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProgressBarComponent } from './progress-bar.component';
import { SimpleChange } from '@angular/core';

describe('ProgressBarComponent', () => {
  let component: ProgressBarComponent;
  let fixture: ComponentFixture<ProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressBarComponent ],
      imports: [ BrowserAnimationsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display progress bar when isNavigating is false', () => {
    component.isNavigating = false;
    fixture.detectChanges();
    
    const progressBarContainer = fixture.nativeElement.querySelector('.progress-bar-container');
    expect(progressBarContainer).toBeNull();
  });

  it('should display progress bar when isNavigating is true', () => {
    component.isNavigating = true;
    fixture.detectChanges();
    
    const progressBarContainer = fixture.nativeElement.querySelector('.progress-bar-container');
    expect(progressBarContainer).toBeTruthy();
  });

  it('should start progress when navigation begins', fakeAsync(() => {
    component.isNavigating = true;
    component.ngOnChanges({
      isNavigating: new SimpleChange(false, true, false)
    });
    
    expect(component.progress).toBe(0);
    
    tick(200);
    expect(component.progress).toBeGreaterThan(0);
    expect(component.progress).toBeLessThan(90);
    discardPeriodicTasks();
  }));

  it('should complete progress when navigation ends', fakeAsync(() => {
    component.isNavigating = true;
    component.ngOnChanges({
      isNavigating: new SimpleChange(false, true, false)
    });
    
    tick(200);
    
    component.isNavigating = false;
    component.ngOnChanges({
      isNavigating: new SimpleChange(true, false, false)
    });
    
    expect(component.progress).toBe(100);
    
    tick(200);
    expect(component.progress).toBe(0);
    discardPeriodicTasks();
  }));

  it('should not exceed 90% progress during navigation', fakeAsync(() => {
    component.isNavigating = true;
    component.ngOnChanges({
      isNavigating: new SimpleChange(false, true, false)
    });
    
    for (let i = 0; i < 50; i++) {
      tick(200);
    }
    
    expect(component.progress).toBeLessThanOrEqual(90);
    discardPeriodicTasks();
  }));

  it('should clear interval on component destroy', () => {
    component.isNavigating = true;
    component.ngOnChanges({
      isNavigating: new SimpleChange(false, true, false)
    });
    
    const clearIntervalSpy = spyOn(window, 'clearInterval');
    component.ngOnDestroy();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should apply correct styles for progress bar', () => {
    component.isNavigating = true;
    component.progress = 50;
    fixture.detectChanges();
    
    const progressBar = fixture.nativeElement.querySelector('.progress-bar');
    expect(progressBar).toBeTruthy();
    expect(progressBar.style.width).toBe('50%');
  });
});
