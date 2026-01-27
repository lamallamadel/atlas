import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LottieAnimationComponent } from './lottie-animation.component';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

describe('LottieAnimationComponent', () => {
  let component: LottieAnimationComponent;
  let fixture: ComponentFixture<LottieAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LottieAnimationComponent ],
      imports: [ MatIconModule ]
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

  it('should set useFallback to true on animation load error', (done) => {
    component.animationType = 'search-empty';
    component.error.subscribe((error: Error) => {
      expect(component.useFallback).toBe(true);
      done();
    });
    
    // Trigger ngOnInit which calls loadAnimation
    // Mock will cause it to fail and trigger fallback
    fixture.detectChanges();
  });

  it('should return correct fallback icon for animation type', () => {
    expect(component.animationType = 'search-empty', component.getFallbackIcon()).toBe('search');
    expect(component.animationType = 'success', component.getFallbackIcon()).toBe('check_circle');
    expect(component.animationType = 'error', component.getFallbackIcon()).toBe('error');
    expect(component.animationType = 'upload', component.getFallbackIcon()).toBe('cloud_upload');
    expect(component.animationType = 'maintenance', component.getFallbackIcon()).toBe('build');
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
