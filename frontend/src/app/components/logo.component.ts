import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

export type LogoVariant = 'horizontal' | 'vertical' | 'icon';
export type LogoTheme = 'default' | 'light' | 'dark' | 'mono' | 'auto';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LogoComponent implements OnInit {
  @Input() variant: LogoVariant = 'horizontal';
  @Input() theme: LogoTheme = 'auto';
  @Input() animate = false;
  @Input() width?: string;
  @Input() height?: string;
  @Input() ariaLabel = 'Atlas Immobilier';

  logoPath = '';
  showAnimation = false;

  ngOnInit(): void {
    this.updateLogoPath();
    
    if (this.animate) {
      // Trigger animation after component initialization
      setTimeout(() => {
        this.showAnimation = true;
      }, 50);
    }
  }

  private updateLogoPath(): void {
    let themeSuffix = '';
    
    if (this.theme === 'auto') {
      // Detect system theme preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeSuffix = prefersDark ? '-dark' : '';
    } else if (this.theme !== 'default') {
      themeSuffix = `-${this.theme}`;
    }

    if (this.variant === 'icon') {
      this.logoPath = `/assets/brand/logo-icon${themeSuffix === '-light' ? '' : themeSuffix}.svg`;
    } else {
      this.logoPath = `/assets/brand/logo-${this.variant}${themeSuffix}.svg`;
    }
  }

  get containerClass(): string {
    const classes = ['logo-container', `logo-${this.variant}`];
    if (this.showAnimation) {
      classes.push('logo-animated');
    }
    return classes.join(' ');
  }

  get imageStyles(): any {
    const styles: any = {};
    if (this.width) {
      styles.width = this.width;
    }
    if (this.height) {
      styles.height = this.height;
    }
    return styles;
  }
}
