import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-public-layout',
    templateUrl: './public-layout.component.html',
    styleUrls: ['./public-layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [RouterLink, RouterOutlet]
})
export class PublicLayoutComponent implements OnInit, OnDestroy {

  isDark = false;
  mobileMenuOpen = false;
  scrolled = false;
  currentRoute = '';

  private routerSub!: Subscription;

  constructor(private router: Router) {}

  /**
   * Lien « Passer au contenu » : focus sur le contenu principal sans changer d'URL (avec
   * <base href="/">, un simple href="#…" renverrait vers la racine du site).
   */
  skipToContent(event: Event, id: string): void {
    event.preventDefault();
    const target = document.getElementById(id);
    target?.focus();
    target?.scrollIntoView({ block: 'start' });
  }

  ngOnInit(): void {
    // Detect system preference
    const saved = localStorage.getItem('atlasia-theme');
    if (saved) {
      this.isDark = saved === 'dark';
    } else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();

    // Track current route for active nav
    this.currentRoute = this.router.url;
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
      this.mobileMenuOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.scrolled = window.scrollY > 30;
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('atlasia-theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }

  isPortail(): boolean {
    return !this.currentRoute.startsWith('/biz');
  }

  isVitrine(): boolean {
    return this.currentRoute.startsWith('/biz');
  }

  isActive(prefix: string): boolean {
    return this.currentRoute.startsWith(prefix);
  }

  navigateToBiz(): void {
    this.router.navigate(['/biz']);
  }
}
