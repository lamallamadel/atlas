import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef, 
  OnInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

export type LottieAnimationType = 'search-empty' | 'success' | 'error' | 'upload' | 'maintenance';

export interface LottieOptions {
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
}

@Component({
  selector: 'app-lottie-animation',
  templateUrl: './lottie-animation.component.html',
  styleUrls: ['./lottie-animation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LottieAnimationComponent implements OnInit, OnDestroy {
  @Input() animationType!: LottieAnimationType;
  @Input() width = 200;
  @Input() height = 200;
  @Input() loop = true;
  @Input() autoplay = true;
  @Input() speed = 1;
  @Input() showControls = false;
  
  @Output() animationCreated = new EventEmitter<any>();
  @Output() animationComplete = new EventEmitter<void>();
  @Output() loopComplete = new EventEmitter<void>();
  @Output() animationError = new EventEmitter<Error>();
  
  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef;
  
  isPlaying = true;
  isPaused = false;
  useFallback = false;
  lottieInstance: any = null;
  private destroyed = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAnimation();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroyAnimation();
  }

  private async loadAnimation(): Promise<void> {
    try {
      // Dynamically import lottie-web only when needed
      const lottie = await import('lottie-web/build/player/lottie_light');
      
      if (this.destroyed) return;
      
      const animationData = await this.loadAnimationData();
      
      if (this.destroyed) return;
      
      this.lottieInstance = lottie.default.loadAnimation({
        container: this.lottieContainer.nativeElement,
        renderer: 'svg',
        loop: this.loop,
        autoplay: this.autoplay,
        animationData: animationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
          hideOnTransparent: true
        }
      });

      this.lottieInstance.setSpeed(this.speed);
      
      this.lottieInstance.addEventListener('complete', () => {
        if (!this.destroyed) {
          this.animationComplete.emit();
        }
      });
      
      this.lottieInstance.addEventListener('loopComplete', () => {
        if (!this.destroyed) {
          this.loopComplete.emit();
        }
      });
      
      this.lottieInstance.addEventListener('DOMLoaded', () => {
        if (!this.destroyed) {
          this.animationCreated.emit(this.lottieInstance);
        }
      });
      
      this.useFallback = false;
      this.cdr.markForCheck();
      
    } catch (err) {
      console.error('Failed to load Lottie animation:', err);
      this.useFallback = true;
      this.animationError.emit(err as Error);
      this.cdr.markForCheck();
    }
  }

  private async loadAnimationData(): Promise<any> {
    // Import animation JSON files dynamically
    switch (this.animationType) {
      case 'search-empty':
        return (await import('../../assets/search-empty.animation.json')).default;
      case 'success':
        return (await import('../../assets/success.animation.json')).default;
      case 'error':
        return (await import('../../assets/error.animation.json')).default;
      case 'upload':
        return (await import('../../assets/upload.animation.json')).default;
      case 'maintenance':
        return (await import('../../assets/maintenance.animation.json')).default;
      default:
        throw new Error(`Unknown animation type: ${this.animationType}`);
    }
  }

  play(): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.play();
      this.isPlaying = true;
      this.isPaused = false;
      this.cdr.markForCheck();
    }
  }

  pause(): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.pause();
      this.isPlaying = false;
      this.isPaused = true;
      this.cdr.markForCheck();
    }
  }

  stop(): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.stop();
      this.isPlaying = false;
      this.isPaused = false;
      this.cdr.markForCheck();
    }
  }

  toggle(): void {
    if (this.isPaused || !this.isPlaying) {
      this.play();
    } else {
      this.pause();
    }
  }

  setSpeed(speed: number): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.setSpeed(speed);
      this.speed = speed;
      this.cdr.markForCheck();
    }
  }

  goToAndPlay(frame: number): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.goToAndPlay(frame, true);
      this.isPlaying = true;
      this.isPaused = false;
      this.cdr.markForCheck();
    }
  }

  goToAndStop(frame: number): void {
    if (this.lottieInstance && !this.useFallback) {
      this.lottieInstance.goToAndStop(frame, true);
      this.isPlaying = false;
      this.isPaused = true;
      this.cdr.markForCheck();
    }
  }

  private destroyAnimation(): void {
    if (this.lottieInstance) {
      this.lottieInstance.destroy();
      this.lottieInstance = null;
    }
  }

  getFallbackIcon(): string {
    const icons: Record<LottieAnimationType, string> = {
      'search-empty': 'search',
      'success': 'check_circle',
      'error': 'error',
      'upload': 'cloud_upload',
      'maintenance': 'build'
    };
    return icons[this.animationType] || 'help_outline';
  }

  getFallbackColor(): string {
    const colors: Record<LottieAnimationType, string> = {
      'search-empty': '#667eea',
      'success': '#2bbb72',
      'error': '#f24545',
      'upload': '#667eea',
      'maintenance': '#9ca3af'
    };
    return colors[this.animationType] || '#6b7280';
  }
}
