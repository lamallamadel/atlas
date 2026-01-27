import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyLoadImage]'
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input() appLazyLoadImage!: string;
  @Input() placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E';
  @Input() blurUpPlaceholder?: string;
  @Input() errorImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3EImage non disponible%3C/text%3E%3C/svg%3E';

  private intersectionObserver?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.setupLazyLoading();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupLazyLoading(): void {
    const img = this.el.nativeElement;

    // Apply blur effect class
    this.renderer.addClass(img, 'lazy-image');
    this.renderer.addClass(img, 'lazy-image-loading');

    // Set placeholder
    if (this.blurUpPlaceholder) {
      this.renderer.setAttribute(img, 'src', this.blurUpPlaceholder);
    } else {
      this.renderer.setAttribute(img, 'src', this.placeholder);
    }

    // Setup intersection observer
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage();
              if (this.intersectionObserver) {
                this.intersectionObserver.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      this.intersectionObserver.observe(img);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.loadImage();
    }
  }

  private loadImage(): void {
    const img = this.el.nativeElement;
    const tempImg = new Image();

    tempImg.onload = () => {
      this.renderer.setAttribute(img, 'src', this.appLazyLoadImage);
      this.renderer.removeClass(img, 'lazy-image-loading');
      this.renderer.addClass(img, 'lazy-image-loaded');
    };

    tempImg.onerror = () => {
      this.renderer.setAttribute(img, 'src', this.errorImage);
      this.renderer.removeClass(img, 'lazy-image-loading');
      this.renderer.addClass(img, 'lazy-image-error');
    };

    tempImg.src = this.appLazyLoadImage;
  }
}
