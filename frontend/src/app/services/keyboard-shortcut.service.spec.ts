import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutService,
        { provide: Router, useValue: routerMock }
      ]
    });
    
    service = TestBed.inject(KeyboardShortcutService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default preferences', () => {
    const prefs = service.getPreferences();
    expect(prefs.keyboardShortcutsEnabled).toBe(true);
    expect(prefs.showShortcutHints).toBe(true);
  });

  it('should save and load preferences', () => {
    const newPrefs = {
      keyboardShortcutsEnabled: false,
      showShortcutHints: false
    };
    
    service.savePreferences(newPrefs);
    const loaded = service.getPreferences();
    
    expect(loaded.keyboardShortcutsEnabled).toBe(false);
    expect(loaded.showShortcutHints).toBe(false);
  });

  it('should register default shortcuts', () => {
    const shortcuts = service.getAllShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it('should get shortcuts by category', () => {
    const navShortcuts = service.getShortcutsByCategory('navigation');
    expect(navShortcuts.length).toBeGreaterThan(0);
    navShortcuts.forEach(s => expect(s.category).toBe('navigation'));
  });

  it('should toggle command palette visibility', () => {
    let visible = false;
    service.commandPaletteVisible$.subscribe(v => visible = v);
    
    service.toggleCommandPalette();
    expect(visible).toBe(true);
    
    service.toggleCommandPalette();
    expect(visible).toBe(false);
  });

  it('should toggle shortcut help visibility', () => {
    let visible = false;
    service.shortcutHelpVisible$.subscribe(v => visible = v);
    
    service.toggleShortcutHelp();
    expect(visible).toBe(true);
    
    service.toggleShortcutHelp();
    expect(visible).toBe(false);
  });

  it('should reset list navigation', () => {
    let activeIndex = 0;
    service.activeListItem$.subscribe(i => activeIndex = i);
    
    service.setActiveListItem(5);
    expect(activeIndex).toBe(5);
    
    service.resetListNavigation();
    expect(activeIndex).toBe(-1);
  });
});
