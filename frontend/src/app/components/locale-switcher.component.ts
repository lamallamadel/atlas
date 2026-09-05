import { Component, OnInit, inject } from '@angular/core';
import { I18nService, SupportedLocale } from '../services/i18n.service';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { LocalizePipe } from '../pipes/localize.pipe';
import { DsIconComponent } from '../design-system/icons/ds-icon.component';

@Component({
    selector: 'app-locale-switcher',
    template: `
    <span class="locale-menu-origin" cdkOverlayOrigin #localeOrigin="cdkOverlayOrigin">
      <button
        type="button"
        class="locale-switcher"
        (click)="toggleLocaleMenu()"
        [attr.aria-expanded]="localeMenuOpen"
        aria-haspopup="menu"
        aria-controls="locale-switcher-menu"
        [attr.aria-label]="'Change language' | localize">
        <span class="locale-flag">{{ currentLocaleInfo?.flag }}</span>
        <ds-icon class="locale-icon" name="globe" [size]="20"></ds-icon>
      </button>
    </span>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="localeOrigin"
      [cdkConnectedOverlayOpen]="localeMenuOpen"
      [cdkConnectedOverlayPositions]="localeMenuPositions"
      [cdkConnectedOverlayScrollStrategy]="localeMenuScrollStrategy"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'ds-menu-backdrop'"
      (backdropClick)="closeLocaleMenu()"
      (detach)="closeLocaleMenu()"
      (overlayKeydown)="$event.key === 'Escape' && closeLocaleMenu()">
      <div id="locale-switcher-menu" class="locale-dropdown" role="menu">
        <div class="locale-menu-header" i18n="@@localeMenuHeader">
          Choose Language / Choisir la langue
        </div>
        <div class="locale-dropdown-divider" role="separator"></div>
        @for (locale of supportedLocales; track locale.code) {
          <button
            type="button"
            class="locale-menu-item"
            role="menuitem"
            (click)="changeLocale(locale.code)"
            [class.active]="locale.code === currentLocale"
            [attr.aria-label]="'Switch to ' + locale.nativeName">
            <span class="locale-flag">{{ locale.flag }}</span>
            <span class="locale-name">{{ locale.nativeName }}</span>
            <span class="locale-name-secondary">({{ locale.name }})</span>
            @if (locale.code === currentLocale) {
              <ds-icon class="locale-check" name="check" [size]="20" aria-hidden="true" />
            }
          </button>
        }
      </div>
    </ng-template>
    `,
    styles: [`
    .locale-menu-origin {
      display: inline-flex;
      align-items: center;
    }

    .locale-switcher {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: var(--ds-radius-md);
      transition: background-color 0.15s ease;
      color: inherit;
    }

    .locale-switcher:hover {
      background: rgba(0, 0, 0, 0.06);
    }

    :host-context(.dark-theme) .locale-switcher:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .locale-flag {
      font-size: 20px;
      line-height: 1;
    }

    .locale-icon {
      color: var(--ds-text-muted);
    }

    .locale-dropdown {
      min-width: 250px;
      background: var(--ds-surface-elevated, #fff);
      color: var(--ds-text-primary, rgba(0, 0, 0, 0.87));
      border-radius: var(--ds-radius-lg, 8px);
      box-shadow: var(--ds-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
      border: 1px solid var(--ds-border-subtle, rgba(0, 0, 0, 0.08));
      overflow: hidden;
    }

    .locale-menu-header {
      padding: 12px 16px;
      font-weight: 500;
      font-size: 14px;
      color: var(--ds-text-primary, rgba(0, 0, 0, 0.87));
      text-align: center;
    }

    .locale-dropdown-divider {
      height: 1px;
      background: var(--ds-divider, rgba(0, 0, 0, 0.08));
    }

    .locale-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      margin: 0;
      padding: 8px 16px;
      min-height: 48px;
      border: none;
      background: transparent;
      cursor: pointer;
      font: inherit;
      text-align: left;
      color: inherit;
      box-sizing: border-box;
    }

    .locale-menu-item:hover {
      background: var(--ds-primary-subtle, rgba(0, 0, 0, 0.04));
    }

    .locale-menu-item.active {
      background: var(--ds-primary-subtle, rgba(0, 0, 0, 0.06));
    }

    .locale-menu-item:focus-visible {
      outline: 2px solid var(--ds-marine);
      outline-offset: -2px;
    }

    .locale-name {
      flex: 1;
      font-size: 14px;
    }

    .locale-name-secondary {
      font-size: 12px;
      color: var(--ds-text-muted, rgba(0, 0, 0, 0.6));
    }

    .locale-check {
      flex-shrink: 0;
      color: var(--ds-marine);
    }

    :host-context(.dark-theme) .locale-menu-header {
      color: var(--ds-text-primary, rgba(255, 255, 255, 0.87));
    }

    :host-context(.dark-theme) .locale-menu-item.active {
      background: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark-theme) .locale-name-secondary {
      color: var(--ds-text-muted, rgba(255, 255, 255, 0.6));
    }
  `],
    imports: [CdkConnectedOverlay, CdkOverlayOrigin, LocalizePipe, DsIconComponent]
})
export class LocaleSwitcherComponent implements OnInit {
  private readonly overlay = inject(Overlay);

  localeMenuOpen = false;
  readonly localeMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly localeMenuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];

  supportedLocales: SupportedLocale[] = [];
  currentLocale = 'fr';
  currentLocaleInfo?: SupportedLocale;

  constructor(private i18nService: I18nService) {}

  ngOnInit(): void {
    this.supportedLocales = this.i18nService.getSupportedLocales();
    this.currentLocale = this.i18nService.currentLocale;
    this.currentLocaleInfo = this.i18nService.getLocaleInfo(this.currentLocale);

    this.i18nService.currentLocale$.subscribe(locale => {
      this.currentLocale = locale;
      this.currentLocaleInfo = this.i18nService.getLocaleInfo(locale);
    });
  }

  toggleLocaleMenu(): void {
    this.localeMenuOpen = !this.localeMenuOpen;
  }

  closeLocaleMenu(): void {
    this.localeMenuOpen = false;
  }

  changeLocale(locale: string): void {
    this.closeLocaleMenu();
    this.i18nService.changeLocale(locale);
  }
}
