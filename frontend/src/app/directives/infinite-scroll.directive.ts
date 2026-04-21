import { Directive, ElementRef, OnDestroy, OnInit, input, output } from '@angular/core';

@Directive({ selector: '[appInfiniteScroll]' })
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  readonly scrollThreshold = input(0.8);
  readonly scrollDebounceTime = input(200);
  readonly scrolled = output<void>();

  private intersectionObserver?: IntersectionObserver;
  private scrollTimeout?: any;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private setupIntersectionObserver(): void {
    const element = this.el.nativeElement;

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.onScroll();
            }
          });
        },
        {
          root: null,
          rootMargin: `${(1 - this.scrollThreshold()) * 100}%`,
          threshold: 0.1
        }
      );

      // Create a sentinel element at the bottom
      const sentinel = document.createElement('div');
      sentinel.className = 'infinite-scroll-sentinel';
      sentinel.style.height = '1px';
      element.appendChild(sentinel);
      this.intersectionObserver.observe(sentinel);
    } else {
      // Fallback to scroll event
      element.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  private handleScroll(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const element = this.el.nativeElement;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      const scrollPosition = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPosition >= this.scrollThreshold()) {
        this.onScroll();
      }
    }, this.scrollDebounceTime());
  }

  private onScroll(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.scrolled.emit();
  }
}
