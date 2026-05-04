import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';

export interface IosTabItem {
  value: string;
  label: string;
  icon: string;
  badge?: number;
}

/**
 * Tab bar iOS — Glass effect, Safe Area bottom, Cupertino style.
 * Utilisé via Capacitor sur iOS uniquement.
 */
@Component({
  selector: 'ds-ios-tabbar',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    <nav class="ds-ios-tabbar" role="tablist" [attr.aria-label]="label">
      <div class="ds-ios-tabbar__blur"></div>
      <div class="ds-ios-tabbar__items">
        @for (tab of tabs; track tab.value) {
          <button
            class="ds-ios-tabbar__item"
            [class.ds-ios-tabbar__item--active]="tab.value === activeTab"
            role="tab"
            [attr.aria-selected]="tab.value === activeTab"
            [attr.aria-label]="tab.label"
            (click)="select(tab)">
            <div class="ds-ios-tabbar__icon">
              <ds-icon [name]="tab.icon" [size]="24"></ds-icon>
              @if (tab.badge) {
                <span class="ds-ios-tabbar__badge" aria-live="polite">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
              }
            </div>
            <span class="ds-ios-tabbar__label">{{ tab.label }}</span>
          </button>
        }
      </div>
      <!-- Safe Area iOS -->
      <div class="ds-ios-tabbar__safe-area"></div>
    </nav>
  `,
  styles: [`
    .ds-ios-tabbar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }
    .ds-ios-tabbar__blur {
      position: absolute;
      inset: 0;
      background: rgba(var(--ds-surface-rgb, 255,255,255), 0.72);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-top: 0.5px solid var(--ds-divider);
    }
    .ds-ios-tabbar__items {
      position: relative;
      display: flex;
      justify-content: space-around;
      padding: 4px 0 0;
    }
    .ds-ios-tabbar__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 4px 2px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--ds-text-faint);
      transition: color 120ms ease;
      min-width: 44px;
      -webkit-tap-highlight-color: transparent;
    }
    .ds-ios-tabbar__item--active {
      color: var(--ds-marine);
    }
    .ds-ios-tabbar__icon { position: relative; }
    .ds-ios-tabbar__badge {
      position: absolute;
      top: -4px;
      right: -8px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: var(--ds-error);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--ds-surface);
    }
    .ds-ios-tabbar__label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1px;
      line-height: 1.2;
    }
    .ds-ios-tabbar__safe-area {
      height: env(safe-area-inset-bottom, 0px);
    }
  `],
})
export class GlassTabbarComponent {
  @Input() tabs: IosTabItem[] = [];
  @Input() activeTab = '';
  @Input() label = 'Navigation principale';
  @Output() tabChange = new EventEmitter<string>();

  select(tab: IosTabItem): void {
    this.activeTab = tab.value;
    this.tabChange.emit(tab.value);
  }
}
