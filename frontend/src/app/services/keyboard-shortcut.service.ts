import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'lists';
  sequence?: boolean;
}

export interface UserPreferences {
  keyboardShortcutsEnabled: boolean;
  showShortcutHints: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  private readonly PREFERENCES_KEY = 'keyboard-shortcuts-preferences';
  private preferencesSubject: BehaviorSubject<UserPreferences>;
  public preferences$: Observable<UserPreferences>;
  
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private sequenceBuffer: string[] = [];
  private sequenceTimeout: any;
  
  private commandPaletteVisibleSubject = new BehaviorSubject<boolean>(false);
  public commandPaletteVisible$ = this.commandPaletteVisibleSubject.asObservable();
  
  private shortcutHelpVisibleSubject = new BehaviorSubject<boolean>(false);
  public shortcutHelpVisible$ = this.shortcutHelpVisibleSubject.asObservable();
  
  private activeListItemSubject = new BehaviorSubject<number>(-1);
  public activeListItem$ = this.activeListItemSubject.asObservable();

  constructor(private router: Router) {
    const savedPrefs = this.loadPreferences();
    this.preferencesSubject = new BehaviorSubject<UserPreferences>(savedPrefs);
    this.preferences$ = this.preferencesSubject.asObservable();
    this.registerDefaultShortcuts();
  }

  private loadPreferences(): UserPreferences {
    const saved = localStorage.getItem(this.PREFERENCES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return this.getDefaultPreferences();
      }
    }
    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      keyboardShortcutsEnabled: true,
      showShortcutHints: true
    };
  }

  savePreferences(preferences: UserPreferences): void {
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    this.preferencesSubject.next(preferences);
  }

  getPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  private registerDefaultShortcuts(): void {
    this.registerShortcut({
      key: '/',
      description: 'Focus recherche',
      category: 'navigation',
      action: () => this.focusSearch()
    });

    this.registerShortcut({
      key: 'Ctrl+K',
      description: 'Ouvrir la palette de commandes',
      category: 'actions',
      action: () => this.toggleCommandPalette()
    });

    this.registerShortcut({
      key: 'g+a',
      description: 'Aller aux annonces',
      category: 'navigation',
      sequence: true,
      action: () => this.navigateToAnnonces()
    });

    this.registerShortcut({
      key: 'g+d',
      description: 'Aller aux dossiers',
      category: 'navigation',
      sequence: true,
      action: () => this.navigateToDossiers()
    });

    this.registerShortcut({
      key: 'g+h',
      description: 'Aller au tableau de bord',
      category: 'navigation',
      sequence: true,
      action: () => this.navigateToDashboard()
    });

    this.registerShortcut({
      key: 'g+t',
      description: 'Aller aux tâches',
      category: 'navigation',
      sequence: true,
      action: () => this.navigateToTasks()
    });

    this.registerShortcut({
      key: 'Escape',
      description: 'Fermer les modales',
      category: 'actions',
      action: () => this.closeModals()
    });

    this.registerShortcut({
      key: '?',
      description: 'Afficher les raccourcis clavier',
      category: 'actions',
      action: () => this.toggleShortcutHelp()
    });

    this.registerShortcut({
      key: 'j',
      description: 'Élément suivant dans la liste',
      category: 'lists',
      action: () => this.navigateListDown()
    });

    this.registerShortcut({
      key: 'k',
      description: 'Élément précédent dans la liste',
      category: 'lists',
      action: () => this.navigateListUp()
    });

    this.registerShortcut({
      key: 'Enter',
      description: 'Ouvrir l\'élément sélectionné',
      category: 'lists',
      action: () => this.openSelectedListItem()
    });
  }

  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.key, shortcut);
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const preferences = this.getPreferences();
    if (!preferences.keyboardShortcutsEnabled) {
      return false;
    }

    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    if (event.key === 'Escape') {
      this.closeModals();
      return true;
    }

    if (event.key === '?' && !isInputField) {
      event.preventDefault();
      this.toggleShortcutHelp();
      return true;
    }

    if (isInputField && event.key !== 'Escape') {
      return false;
    }

    const key = this.getKeyString(event);
    
    if (this.shortcuts.has(key) && !this.shortcuts.get(key)?.sequence) {
      event.preventDefault();
      this.shortcuts.get(key)?.action();
      return true;
    }

    if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key.length === 1) {
      this.sequenceBuffer.push(event.key.toLowerCase());
      
      if (this.sequenceTimeout) {
        clearTimeout(this.sequenceTimeout);
      }
      
      this.sequenceTimeout = setTimeout(() => {
        this.sequenceBuffer = [];
      }, 1000);

      const sequence = this.sequenceBuffer.join('+');
      if (this.shortcuts.has(sequence)) {
        event.preventDefault();
        this.shortcuts.get(sequence)?.action();
        this.sequenceBuffer = [];
        return true;
      }
    }

    return false;
  }

  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    if (event.shiftKey && event.key.length > 1) parts.push('Shift');
    
    parts.push(event.key);
    
    return parts.join('+');
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category);
  }

  private focusSearch(): void {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }

  toggleCommandPalette(): void {
    const currentState = this.commandPaletteVisibleSubject.value;
    this.commandPaletteVisibleSubject.next(!currentState);
  }

  closeCommandPalette(): void {
    this.commandPaletteVisibleSubject.next(false);
  }

  toggleShortcutHelp(): void {
    const currentState = this.shortcutHelpVisibleSubject.value;
    this.shortcutHelpVisibleSubject.next(!currentState);
  }

  closeShortcutHelp(): void {
    this.shortcutHelpVisibleSubject.next(false);
  }

  private navigateToAnnonces(): void {
    this.router.navigate(['/annonces']);
  }

  private navigateToDossiers(): void {
    this.router.navigate(['/dossiers']);
  }

  private navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private navigateToTasks(): void {
    this.router.navigate(['/tasks']);
  }

  private closeModals(): void {
    if (this.commandPaletteVisibleSubject.value) {
      this.closeCommandPalette();
      return;
    }
    
    if (this.shortcutHelpVisibleSubject.value) {
      this.closeShortcutHelp();
      return;
    }
    
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      bubbles: true
    });
    document.dispatchEvent(escEvent);
  }

  private navigateListDown(): void {
    const current = this.activeListItemSubject.value;
    this.activeListItemSubject.next(current + 1);
  }

  private navigateListUp(): void {
    const current = this.activeListItemSubject.value;
    if (current > 0) {
      this.activeListItemSubject.next(current - 1);
    }
  }

  private openSelectedListItem(): void {
    const activeIndex = this.activeListItemSubject.value;
    if (activeIndex >= 0) {
      const event = new CustomEvent('list-item-selected', {
        detail: { index: activeIndex },
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  }

  resetListNavigation(): void {
    this.activeListItemSubject.next(-1);
  }

  setActiveListItem(index: number): void {
    this.activeListItemSubject.next(index);
  }
}
