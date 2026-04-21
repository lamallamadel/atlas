import { Component, OnInit, ViewEncapsulation, input } from '@angular/core';
import { NgStyle } from '@angular/common';

export type LogoVariant = 'horizontal' | 'vertical' | 'icon';
export type LogoTheme = 'default' | 'light' | 'dark' | 'mono' | 'auto';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [NgStyle]
})
export class LogoComponent implements OnInit {
  readonly variant = input<LogoVariant>('horizontal');
  readonly theme = input<LogoTheme>('auto');
  readonly animate = input(false);
  readonly width = input<string>();
  readonly height = input<string>();
  readonly ariaLabel = input('Atlas Immobilier');

  logoPath = '';
  showAnimation = false;

  ngOnInit(): void {
    this.updateLogoPath();
    
    if (this.animate()) {
      // Trigger animation after component initialization
      setTimeout(() => {
        this.showAnimation = true;
      }, 50);
    }
  }

  private updateLogoPath(): void {
    let themeSuffix = '';
    
    const theme = this.theme();
    if (theme === 'auto') {
      // Detect system theme preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeSuffix = prefersDark ? '-dark' : '';
    } else if (theme !== 'default') {
      themeSuffix = `-${theme}`;
    }

    const variant = this.variant();
    if (variant === 'icon') {
      this.logoPath = `/assets/brand/logo-icon${themeSuffix === '-light' ? '' : themeSuffix}.svg`;
    } else {
      this.logoPath = `/assets/brand/logo-${variant}${themeSuffix}.svg`;
    }
  }

  get containerClass(): string {
    const classes = ['logo-container', `logo-${this.variant()}`];
    if (this.showAnimation) {
      classes.push('logo-animated');
    }
    return classes.join(' ');
  }

  get imageStyles(): any {
    const styles: any = {};
    const width = this.width();
    if (width) {
      styles.width = width;
    }
    const height = this.height();
    if (height) {
      styles.height = height;
    }
    return styles;
  }
}
