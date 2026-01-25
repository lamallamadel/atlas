import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandPaletteComponent } from './command-palette.component';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let service: KeyboardShortcutService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ CommandPaletteComponent ],
      imports: [
        CommonModule,
        FormsModule,
        MatIconModule
      ],
      providers: [
        KeyboardShortcutService,
        { provide: Router, useValue: routerMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(KeyboardShortcutService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize commands', () => {
    expect(component.commands.length).toBeGreaterThan(0);
    expect(component.filteredCommands.length).toBeGreaterThan(0);
  });

  it('should filter commands on search', () => {
    component.searchQuery = 'annonce';
    component.onSearchChange();
    
    const annonceCommands = component.filteredCommands.filter(c => 
      c.label.toLowerCase().includes('annonce')
    );
    expect(annonceCommands.length).toBeGreaterThan(0);
  });

  it('should navigate on command execution', () => {
    const command = component.commands.find(c => c.id === 'nav-dashboard');
    if (command) {
      component.executeCommand(command);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }
  });

  it('should close palette', () => {
    spyOn(service, 'closeCommandPalette');
    component.close();
    expect(service.closeCommandPalette).toHaveBeenCalled();
  });
});
