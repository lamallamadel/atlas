import { Component, OnInit } from '@angular/core';
import { I18nService, SupportedLocale } from '../services/i18n.service';

@Component({
  selector: 'app-locale-switcher',
  template: `
    <button mat-icon-button [matMenuTriggerFor]="localeMenu" 
            class="locale-switcher"
            [attr.aria-label]="'Change language' | localize">
      <span class="locale-flag">{{ currentLocaleInfo?.flag }}</span>
      <mat-icon class="locale-icon">language</mat-icon>
    </button>

    <mat-menu #localeMenu="matMenu" class="locale-menu">
      <div class="locale-menu-header" i18n="@@localeMenuHeader">
        Choose Language / Choisir la langue
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item 
              *ngFor="let locale of supportedLocales"
              (click)="changeLocale(locale.code)"
              [class.active]="locale.code === currentLocale"
              [attr.aria-label]="'Switch to ' + locale.nativeName">
        <span class="locale-flag">{{ locale.flag }}</span>
        <span class="locale-name">{{ locale.nativeName }}</span>
        <span class="locale-name-secondary">({{ locale.name }})</span>
        <mat-icon *ngIf="locale.code === currentLocale" class="locale-check">check</mat-icon>
      </button>
    </mat-menu>
  `,
  styles: [`
    .locale-switcher {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .locale-flag {
      font-size: 20px;
      line-height: 1;
    }

    .locale-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .locale-menu {
      min-width: 250px;
    }

    .locale-menu-header {
      padding: 12px 16px;
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      text-align: center;
    }

    ::ng-deep .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      min-height: 48px;
    }

    ::ng-deep .mat-mdc-menu-item.active {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .locale-name {
      flex: 1;
      font-size: 14px;
    }

    .locale-name-secondary {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .locale-check {
      color: var(--color-primary, #1976d2);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    :host-context(.dark-theme) .locale-menu-header {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-menu-item.active {
      background-color: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark-theme) .locale-name-secondary {
      color: rgba(255, 255, 255, 0.6);
    }
  `]
})
export class LocaleSwitcherComponent implements OnInit {
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

  changeLocale(locale: string): void {
    this.i18nService.changeLocale(locale);
  }
}
