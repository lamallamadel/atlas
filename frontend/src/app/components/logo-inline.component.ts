import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type LogoVariant = 'horizontal' | 'vertical' | 'icon';
export type LogoTheme = 'default' | 'light' | 'dark' | 'mono' | 'auto';

/**
 * Inline SVG Logo Component with Advanced Path Drawing Animation
 * 
 * This component embeds SVG directly for advanced path drawing animations.
 * Use this when you want the animated drawing effect on load.
 * 
 * For simple logo display without animation, use LogoComponent instead.
 */
@Component({
  selector: 'app-logo-inline',
  templateUrl: './logo-inline.component.html',
  styleUrls: ['./logo-inline.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LogoInlineComponent implements OnInit {
  @Input() variant: LogoVariant = 'horizontal';
  @Input() theme: LogoTheme = 'auto';
  @Input() animate = true;
  @Input() width?: string;
  @Input() height?: string;
  @Input() ariaLabel = 'Atlas Immobilier';

  svgContent: SafeHtml = '';
  showAnimation = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.generateInlineSVG();
    
    if (this.animate) {
      setTimeout(() => {
        this.showAnimation = true;
      }, 100);
    }
  }

  private generateInlineSVG(): void {
    const svg = this.getSVGContent();
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  private getSVGContent(): string {
    const colors = this.getThemeColors();
    
    if (this.variant === 'icon') {
      return this.getIconSVG(colors);
    } else if (this.variant === 'vertical') {
      return this.getVerticalSVG(colors);
    } else {
      return this.getHorizontalSVG(colors);
    }
  }

  private getThemeColors() {
    let gradientStart = '#1976D2';
    let gradientEnd = '#0D47A1';
    let textPrimary = '#1976D2';
    let textSecondary = '#546E7A';
    let windowFill = 'white';

    if (this.theme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        gradientStart = '#90CAF9';
        gradientEnd = '#42A5F5';
        textPrimary = '#90CAF9';
        textSecondary = '#B0BEC5';
        windowFill = '#1E1E1E';
      }
    } else if (this.theme === 'dark') {
      gradientStart = '#90CAF9';
      gradientEnd = '#42A5F5';
      textPrimary = '#90CAF9';
      textSecondary = '#B0BEC5';
      windowFill = '#1E1E1E';
    } else if (this.theme === 'light') {
      gradientStart = '#42A5F5';
      gradientEnd = '#1976D2';
      textPrimary = '#42A5F5';
      textSecondary = '#78909C';
      windowFill = 'white';
    } else if (this.theme === 'mono') {
      gradientStart = '#212121';
      gradientEnd = '#212121';
      textPrimary = '#212121';
      textSecondary = '#424242';
      windowFill = 'white';
    }

    return { gradientStart, gradientEnd, textPrimary, textSecondary, windowFill };
  }

  private getHorizontalSVG(colors: any): string {
    const width = this.width || '400';
    const height = this.height || '100';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" 
           aria-labelledby="logo-title" class="logo-svg logo-horizontal-svg"
           width="${width}" height="${height}">
        <title id="logo-title">${this.ariaLabel}</title>
        <defs>
          <linearGradient id="gradient-${this.variant}-${this.theme}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.gradientStart};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.gradientEnd};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <g class="logo-icon-group">
          <circle cx="40" cy="50" r="28" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2.5" class="path-animated"/>
          <path d="M 40 22 Q 30 50 40 78" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="1.5" stroke-linecap="round" class="path-animated"/>
          <path d="M 40 22 Q 50 50 40 78" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="1.5" stroke-linecap="round" class="path-animated"/>
          <ellipse cx="40" cy="50" rx="28" ry="8" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="1.5" class="path-animated"/>
          <path d="M 15 36 Q 40 38 65 36" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="1.5" stroke-linecap="round" class="path-animated"/>
          <path d="M 15 64 Q 40 62 65 64" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="1.5" stroke-linecap="round" class="path-animated"/>
          
          <g opacity="0.9" class="buildings-group">
            <rect x="32" y="45" width="6" height="15" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            <rect x="40" y="40" width="6" height="20" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            <rect x="48" y="47" width="6" height="13" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            
            <rect x="33.5" y="48" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="33.5" y="51" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="33.5" y="54" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            
            <rect x="41.5" y="43" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="41.5" y="46" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="41.5" y="49" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="41.5" y="52" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="41.5" y="55" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            
            <rect x="49.5" y="50" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="49.5" y="53" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="49.5" y="56" width="1" height="1.5" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          </g>
        </g>
        
        <g class="logo-text-group">
          <text x="85" y="50" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="28" font-weight="700" fill="${colors.textPrimary}" letter-spacing="-0.5" class="text-animated">ATLAS</text>
          <text x="85" y="72" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="16" font-weight="400" fill="${colors.textSecondary}" letter-spacing="1" class="text-animated">IMMOBILIER</text>
        </g>
      </svg>
    `;
  }

  private getVerticalSVG(colors: any): string {
    const width = this.width || '160';
    const height = this.height || '200';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" 
           aria-labelledby="logo-title" class="logo-svg logo-vertical-svg"
           width="${width}" height="${height}">
        <title id="logo-title">${this.ariaLabel}</title>
        <defs>
          <linearGradient id="gradient-${this.variant}-${this.theme}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.gradientStart};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.gradientEnd};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <g transform="translate(80, 60)" class="logo-icon-group">
          <circle cx="0" cy="0" r="35" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="3" class="path-animated"/>
          <path d="M 0 -35 Q -12.5 0 0 35" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
          <path d="M 0 -35 Q 12.5 0 0 35" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
          <ellipse cx="0" cy="0" rx="35" ry="10" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" class="path-animated"/>
          <path d="M -31 -17.5 Q 0 -15.5 31 -17.5" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
          <path d="M -31 17.5 Q 0 15.5 31 17.5" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
          
          <g opacity="0.9" class="buildings-group">
            <rect x="-10" y="-6" width="7" height="19" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            <rect x="0" y="-12" width="7" height="25" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            <rect x="10" y="-4" width="7" height="17" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
            
            <rect x="-8" y="-2" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="-8" y="2" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="-8" y="6" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            
            <rect x="2" y="-8" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="2" y="-4" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="2" y="0" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="2" y="4" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="2" y="8" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            
            <rect x="12" y="0" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="12" y="4" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
            <rect x="12" y="8" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          </g>
        </g>
        
        <g class="logo-text-group">
          <text x="80" y="140" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="32" font-weight="700" fill="${colors.textPrimary}" letter-spacing="-0.5" text-anchor="middle" class="text-animated">ATLAS</text>
          <text x="80" y="165" font-family="'Segoe UI', 'Roboto', 'Arial', sans-serif" font-size="18" font-weight="400" fill="${colors.textSecondary}" letter-spacing="1.5" text-anchor="middle" class="text-animated">IMMOBILIER</text>
        </g>
      </svg>
    `;
  }

  private getIconSVG(colors: any): string {
    const size = this.width || this.height || '80';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" 
           aria-labelledby="logo-title" class="logo-svg logo-icon-svg"
           width="${size}" height="${size}">
        <title id="logo-title">${this.ariaLabel}</title>
        <defs>
          <linearGradient id="gradient-${this.variant}-${this.theme}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.gradientStart};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.gradientEnd};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <circle cx="40" cy="40" r="35" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="3" class="path-animated"/>
        <path d="M 40 5 Q 27.5 40 40 75" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
        <path d="M 40 5 Q 52.5 40 40 75" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
        <ellipse cx="40" cy="40" rx="35" ry="10" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" class="path-animated"/>
        <path d="M 9 22.5 Q 40 20.5 71 22.5" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
        <path d="M 9 57.5 Q 40 55.5 71 57.5" fill="none" stroke="url(#gradient-${this.variant}-${this.theme})" stroke-width="2" stroke-linecap="round" class="path-animated"/>
        
        <g opacity="0.9" class="buildings-group">
          <rect x="30" y="34" width="7" height="19" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
          <rect x="40" y="28" width="7" height="25" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
          <rect x="50" y="36" width="7" height="17" fill="url(#gradient-${this.variant}-${this.theme})" rx="0.5" class="shape-animated"/>
          
          <rect x="32" y="38" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="32" y="42" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="32" y="46" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          
          <rect x="42" y="32" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="42" y="36" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="42" y="40" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="42" y="44" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="42" y="48" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          
          <rect x="52" y="40" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="52" y="44" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
          <rect x="52" y="48" width="1.5" height="2" fill="${colors.windowFill}" opacity="0.7" class="window-animated"/>
        </g>
      </svg>
    `;
  }

  get containerClass(): string {
    const classes = ['logo-inline-container', `logo-${this.variant}`];
    if (this.showAnimation) {
      classes.push('logo-inline-animated');
    }
    return classes.join(' ');
  }
}
