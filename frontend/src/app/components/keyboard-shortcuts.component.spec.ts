import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeyboardShortcutsComponent } from './keyboard-shortcuts.component';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

describe('KeyboardShortcutsComponent', () => {
  let component: KeyboardShortcutsComponent;
  let fixture: ComponentFixture<KeyboardShortcutsComponent>;
  let service: KeyboardShortcutService;

  beforeEach(async () => {
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ KeyboardShortcutsComponent ],
      imports: [
        CommonModule,
        MatIconModule,
        MatCheckboxModule,
        MatButtonModule
      ],
      providers: [
        KeyboardShortcutService,
        { provide: Router, useValue: routerMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyboardShortcutsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load shortcuts on init', () => {
    expect(component.navigationShortcuts.length).toBeGreaterThan(0);
    expect(component.actionShortcuts.length).toBeGreaterThan(0);
    expect(component.listShortcuts.length).toBeGreaterThan(0);
  });

  it('should close shortcuts overlay', () => {
    spyOn(service, 'closeShortcutHelp');
    component.close();
    expect(service.closeShortcutHelp).toHaveBeenCalled();
  });

  it('should toggle shortcuts enabled', () => {
    const initialState = component.preferences.keyboardShortcutsEnabled;
    component.toggleShortcutsEnabled();
    expect(component.preferences.keyboardShortcutsEnabled).toBe(!initialState);
  });

  it('should format key strings', () => {
    expect(component.formatKey('Ctrl+K')).toContain('⌃');
    expect(component.formatKey('Alt+S')).toContain('⌥');
  });
});
