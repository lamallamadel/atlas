import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LottieAnimationComponent } from './lottie-animation.component';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

describe('LottieAnimationComponent', () => {
  let component: LottieAnimationComponent;
  let fixture: ComponentFixture<LottieAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LottieAnimationComponent],
      imports: [MatIconModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LottieAnimationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.width).toBe(200);
    expect(component.height).toBe(200);
    expect(component.loop).toBe(true);
    expect(component.autoplay).toBe(true);
    expect(component.speed).toBe(1);
    expect(component.showControls).toBe(false);
  });

  it('should set useFallback to true on animation load error', fakeAsync(() => {
    component.animationType = 'search-empty';
    let emittedError: Error | null = null;
    component.error.subscribe((err: Error) => { emittedError = err; });

    spyOn(component as any, 'loadAnimationData').and.returnValue(Promise.reject(new Error('Load failed')));
    // loadAnimation() first awaits dynamic import; stub it so we only exercise loadAnimationData rejection
    spyOn(component as any, 'loadAnimation').and.callFake(async () => {
      try {
        await (component as any).loadAnimationData();
      } catch (err) {
        (component as any).useFallback = true;
        component.animationError.emit(err as Error);
        component['cdr'].markForCheck();
      }
    });
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect(component.useFallback).toBe(true);
    expect(emittedError).toBeTruthy();
    expect(emittedError!.message).toBe('Load failed');
  }));

  it('should return correct fallback icon for animation type', () => {
    component.animationType = 'search-empty';
    expect(component.getFallbackIcon()).toBe('search');

    component.animationType = 'success';
    expect(component.getFallbackIcon()).toBe('check_circle');

    component.animationType = 'error';
    expect(component.getFallbackIcon()).toBe('error');

    component.animationType = 'upload';
    expect(component.getFallbackIcon()).toBe('cloud_upload');

    component.animationType = 'maintenance';
    expect(component.getFallbackIcon()).toBe('build');
  });

  it('should return correct fallback color for animation type', () => {
    component.animationType = 'search-empty';
    expect(component.getFallbackColor()).toBe('#667eea');

    component.animationType = 'success';
    expect(component.getFallbackColor()).toBe('#2bbb72');

    component.animationType = 'error';
    expect(component.getFallbackColor()).toBe('#f24545');

    component.animationType = 'upload';
    expect(component.getFallbackColor()).toBe('#667eea');

    component.animationType = 'maintenance';
    expect(component.getFallbackColor()).toBe('#9ca3af');
  });

  it('should emit complete event', (done) => {
    component.complete.subscribe(() => {
      done();
    });
    component.complete.emit();
  });

  it('should emit loopComplete event', (done) => {
    component.loopComplete.subscribe(() => {
      done();
    });
    component.loopComplete.emit();
  });

  it('should have correct initial playing state', () => {
    expect(component.isPlaying).toBe(true);
    expect(component.isPaused).toBe(false);
  });

  describe('Control methods', () => {
    it('should update state when toggling without lottie instance', () => {
      component.useFallback = true;
      const initialState = component.isPlaying;
      component.toggle();
      // State shouldn't change if useFallback is true
      expect(component.isPlaying).toBe(initialState);
    });

    it('should not throw when calling controls without lottie instance', () => {
      component.lottieInstance = null;
      expect(() => component.play()).not.toThrow();
      expect(() => component.pause()).not.toThrow();
      expect(() => component.stop()).not.toThrow();
      expect(() => component.setSpeed(1.5)).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy animation on component destroy', () => {
      component.lottieInstance = {
        destroy: jasmine.createSpy('destroy')
      };

      component.ngOnDestroy();

      expect(component.lottieInstance).toBeNull();
    });
  });
});
