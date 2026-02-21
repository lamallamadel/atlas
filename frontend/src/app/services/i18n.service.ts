import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SupportedLocale {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export interface UserLocalePreference {
  locale: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly LOCALE_STORAGE_KEY = 'user-locale-preference';
  
  public readonly supportedLocales: SupportedLocale[] = [
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      direction: 'ltr',
      flag: '🇫🇷'
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      flag: '🇬🇧'
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      direction: 'ltr',
      flag: '🇪🇸'
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      direction: 'rtl',
      flag: '🇸🇦'
    }
  ];

  private currentLocaleSubject: BehaviorSubject<string>;
  public currentLocale$: Observable<string>;

  private currentDirectionSubject: BehaviorSubject<'ltr' | 'rtl'>;
  public currentDirection$: Observable<'ltr' | 'rtl'>;

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private http: HttpClient
  ) {
    const savedLocale = this.getSavedLocale();
    const initialLocale = savedLocale || this.localeId || 'fr';
    
    this.currentLocaleSubject = new BehaviorSubject<string>(initialLocale);
    this.currentLocale$ = this.currentLocaleSubject.asObservable();

    const direction = this.getLocaleDirection(initialLocale);
    this.currentDirectionSubject = new BehaviorSubject<'ltr' | 'rtl'>(direction);
    this.currentDirection$ = this.currentDirectionSubject.asObservable();

    this.applyDirection(direction);
  }

  get currentLocale(): string {
    return this.currentLocaleSubject.value;
  }

  get currentDirection(): 'ltr' | 'rtl' {
    return this.currentDirectionSubject.value;
  }

  getSupportedLocales(): SupportedLocale[] {
    return this.supportedLocales;
  }

  getLocaleInfo(code: string): SupportedLocale | undefined {
    return this.supportedLocales.find(locale => locale.code === code);
  }

  isRTL(): boolean {
    return this.currentDirection === 'rtl';
  }

  private getLocaleDirection(locale: string): 'ltr' | 'rtl' {
    const localeInfo = this.getLocaleInfo(locale);
    return localeInfo?.direction || 'ltr';
  }

  changeLocale(locale: string): void {
    const localeInfo = this.getLocaleInfo(locale);
    if (!localeInfo) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }

    this.saveLocale(locale);
    this.currentLocaleSubject.next(locale);
    
    const direction = localeInfo.direction;
    this.currentDirectionSubject.next(direction);
    this.applyDirection(direction);

    this.saveUserPreference(locale).subscribe({
      next: () => {
        this.reloadWithLocale(locale);
      },
      error: (err) => {
        console.error('Failed to save locale preference', err);
        this.reloadWithLocale(locale);
      }
    });
  }

  private applyDirection(direction: 'ltr' | 'rtl'): void {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('dir', direction);
    htmlElement.setAttribute('lang', this.currentLocale);
    
    if (direction === 'rtl') {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }

  private reloadWithLocale(locale: string): void {
    const localeInfo = this.getLocaleInfo(locale);
    if (!localeInfo) return;

    const currentPath = window.location.pathname;
    const baseHref = this.getBaseHrefForLocale(locale);
    
    const pathWithoutLocale = currentPath.replace(/^\/(fr|en|es|ar)\//, '/');
    const newPath = locale === 'fr' 
      ? pathWithoutLocale 
      : `${baseHref}${pathWithoutLocale}`;

    window.location.href = window.location.origin + newPath;
  }

  private getBaseHrefForLocale(locale: string): string {
    switch (locale) {
      case 'en': return '/en';
      case 'es': return '/es';
      case 'ar': return '/ar';
      default: return '';
    }
  }

  private saveLocale(locale: string): void {
    try {
      localStorage.setItem(this.LOCALE_STORAGE_KEY, locale);
    } catch (e) {
      console.warn('Failed to save locale to localStorage', e);
    }
  }

  private getSavedLocale(): string | null {
    try {
      return localStorage.getItem(this.LOCALE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to retrieve locale from localStorage', e);
      return null;
    }
  }

  getUserPreference(): Observable<UserLocalePreference> {
    return this.http.get<UserLocalePreference>(`${environment.apiBaseUrl}/user-preferences/locale`);
  }

  saveUserPreference(locale: string): Observable<UserLocalePreference> {
    return this.http.post<UserLocalePreference>(`${environment.apiBaseUrl}/user-preferences/locale`, {
      locale: locale
    });
  }

  t(key: string, params?: Record<string, any>): string {
    return key;
  }
}
