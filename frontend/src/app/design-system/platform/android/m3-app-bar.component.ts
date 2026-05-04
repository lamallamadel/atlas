import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';

export type M3AppBarType = 'top' | 'medium' | 'large';

/**
 * App Bar Material 3 — Top App Bar avec scrolled state.
 * Utilisé via Capacitor sur Android uniquement.
 * Spec : https://m3.material.io/components/top-app-bar
 */
@Component({
  selector: 'ds-m3-app-bar',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    <header
      class="ds-m3-appbar"
      [class]="'ds-m3-appbar--' + type"
      [class.ds-m3-appbar--scrolled]="scrolled">
      <!-- Status bar Android (mock) -->
      <div class="ds-m3-appbar__statusbar" aria-hidden="true">
        <span>9:41</span>
        <div class="ds-m3-appbar__statusbar-icons">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="0.5"/><rect x="4.5" y="2" width="3" height="10" rx="0.5"/><rect x="9" y="0" width="3" height="12" rx="0.5"/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.3"/></svg>
          <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 2.5C4.5 2.5 1.8 3.8 0 6l7.5 6 7.5-6C13.2 3.8 10.5 2.5 7.5 2.5z"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0" y="1" width="22" height="10" rx="2" stroke="currentColor" stroke-width="1" fill="none"/><rect x="1.5" y="2.5" width="15" height="7" rx="1"/><rect x="22.5" y="4" width="2" height="4" rx="1"/></svg>
        </div>
      </div>
      <!-- App bar content -->
      <div class="ds-m3-appbar__bar">
        @if (showBack) {
          <button class="ds-m3-appbar__nav" (click)="back.emit()" aria-label="Retour">
            <ds-icon name="chevron-left" [size]="24"></ds-icon>
          </button>
        }
        @if (type === 'top') {
          <h1 class="ds-m3-appbar__title">{{ title }}</h1>
        }
        <div class="ds-m3-appbar__actions">
          <ng-content select="[slot='actions']"></ng-content>
        </div>
      </div>
      @if (type !== 'top') {
        <div class="ds-m3-appbar__large-title">
          <h1>{{ title }}</h1>
        </div>
      }
    </header>
  `,
  styles: [`
    .ds-m3-appbar {
      background: var(--ds-surface);
      transition: box-shadow 200ms ease, background 200ms ease;
    }
    .ds-m3-appbar--scrolled {
      box-shadow: var(--ds-shadow-sm);
      background: var(--ds-surface-2);
    }
    .ds-m3-appbar__statusbar {
      height: 24px;
      padding: 4px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: var(--ds-text);
    }
    .ds-m3-appbar__statusbar-icons { display: flex; align-items: center; gap: 6px; }
    .ds-m3-appbar__bar {
      height: 64px;
      padding: 0 4px 0 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ds-m3-appbar__nav {
      width: 48px; height: 48px;
      border-radius: 50%; border: none;
      background: transparent; cursor: pointer;
      color: var(--ds-text);
      display: flex; align-items: center; justify-content: center;
    }
    .ds-m3-appbar__nav:hover {
      background: var(--ds-surface-offset);
    }
    .ds-m3-appbar__title {
      flex: 1;
      font-family: var(--ds-font-body);
      font-size: 22px; font-weight: 400;
      color: var(--ds-text); margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ds-m3-appbar__actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
    .ds-m3-appbar__large-title {
      padding: 0 16px 20px;
      h1 {
        font-family: var(--ds-font-body);
        font-size: 32px; font-weight: 400;
        color: var(--ds-text); margin: 0;
      }
    }
    .ds-m3-appbar--scrolled .ds-m3-appbar__large-title { display: none; }
  `],
})
export class M3AppBarComponent {
  @Input() title = '';
  @Input() type: M3AppBarType = 'top';
  @Input() showBack = false;
  @Input() scrolled = false;
  @Output() back = new EventEmitter<void>();
}
