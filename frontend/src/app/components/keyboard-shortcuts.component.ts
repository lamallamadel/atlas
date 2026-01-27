import { Component, OnInit } from '@angular/core';
import { KeyboardShortcutService, KeyboardShortcut, UserPreferences } from '../services/keyboard-shortcut.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-keyboard-shortcuts',
  templateUrl: './keyboard-shortcuts.component.html',
  styleUrls: ['./keyboard-shortcuts.component.css']
})
export class KeyboardShortcutsComponent implements OnInit {
  visible$: Observable<boolean>;
  preferences: UserPreferences;
  navigationShortcuts: KeyboardShortcut[] = [];
  actionShortcuts: KeyboardShortcut[] = [];
  listShortcuts: KeyboardShortcut[] = [];

  constructor(private keyboardShortcutService: KeyboardShortcutService) {
    this.visible$ = this.keyboardShortcutService.shortcutHelpVisible$;
    this.preferences = this.keyboardShortcutService.getPreferences();
  }

  ngOnInit(): void {
    this.loadShortcuts();
    this.keyboardShortcutService.preferences$.subscribe(prefs => {
      this.preferences = prefs;
    });
  }

  loadShortcuts(): void {
    this.navigationShortcuts = this.keyboardShortcutService.getShortcutsByCategory('navigation');
    this.actionShortcuts = this.keyboardShortcutService.getShortcutsByCategory('actions');
    this.listShortcuts = this.keyboardShortcutService.getShortcutsByCategory('lists');
  }

  close(): void {
    this.keyboardShortcutService.closeShortcutHelp();
  }

  toggleShortcutsEnabled(): void {
    const newPrefs = {
      ...this.preferences,
      keyboardShortcutsEnabled: !this.preferences.keyboardShortcutsEnabled
    };
    this.keyboardShortcutService.savePreferences(newPrefs);
  }

  toggleShortcutHints(): void {
    const newPrefs = {
      ...this.preferences,
      showShortcutHints: !this.preferences.showShortcutHints
    };
    this.keyboardShortcutService.savePreferences(newPrefs);
  }

  formatKey(key: string): string {
    return key
      .replace('Ctrl', '⌃')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('Meta', '⌘')
      .replace('+', ' + ');
  }
}
