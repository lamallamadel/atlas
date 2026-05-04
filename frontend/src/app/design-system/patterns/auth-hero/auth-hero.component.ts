import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-auth-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ds-auth">
      <!-- Panneau gauche : formulaire -->
      <div class="ds-auth__panel" id="main-content">
        <div class="ds-auth__brand">
          <div class="ds-auth__brand-mark" aria-hidden="true">A</div>
          <span class="ds-auth__brand-name">Atlasia</span>
        </div>
        <div class="ds-auth__form-wrap">
          @if (eyebrow) {
            <div class="ds-auth__eyebrow">{{ eyebrow }}</div>
          }
          <h1 class="ds-auth__title">
            {{ titleBefore }}
            @if (titleAccent) {
              <em class="ds-auth__accent">{{ titleAccent }}</em>
            }
          </h1>
          @if (subtitle) {
            <p class="ds-auth__subtitle">{{ subtitle }}</p>
          }
          <div class="ds-auth__form">
            <ng-content></ng-content>
          </div>
          @if (legalText) {
            <p class="ds-auth__legal">{{ legalText }}</p>
          }
        </div>
      </div>
      <!-- Panneau droit : hero image -->
      <div class="ds-auth__hero" aria-hidden="true">
        <div class="ds-auth__hero-bg"></div>
        <div class="ds-auth__hero-overlay"></div>
        <div class="ds-auth__hero-copy">
          <div class="ds-auth__hero-display">{{ heroDisplay }}</div>
          @if (heroSub) {
            <div class="ds-auth__hero-sub">{{ heroSub }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./auth-hero.component.scss'],
})
export class AuthHeroComponent {
  @Input() eyebrow: string | null = null;
  @Input() titleBefore = '';
  @Input() titleAccent: string | null = null;
  @Input() subtitle: string | null = null;
  @Input() legalText: string | null = null;
  @Input() heroDisplay = 'Find the place that feels right.';
  @Input() heroSub: string | null = null;
}
