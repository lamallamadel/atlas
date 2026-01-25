import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { Observable } from 'rxjs';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  category: string;
}

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css']
})
export class CommandPaletteComponent implements OnInit, AfterViewInit {
  @ViewChild('commandInput') commandInput!: ElementRef;

  visible$: Observable<boolean>;
  searchQuery = '';
  commands: Command[] = [];
  filteredCommands: Command[] = [];
  selectedIndex = 0;

  constructor(
    private router: Router,
    private keyboardShortcutService: KeyboardShortcutService
  ) {
    this.visible$ = this.keyboardShortcutService.commandPaletteVisible$;
  }

  ngOnInit(): void {
    this.initializeCommands();
    this.filteredCommands = this.commands;

    this.visible$.subscribe(visible => {
      if (visible) {
        setTimeout(() => {
          this.commandInput?.nativeElement?.focus();
        }, 100);
      } else {
        this.searchQuery = '';
        this.filteredCommands = this.commands;
        this.selectedIndex = 0;
      }
    });
  }

  ngAfterViewInit(): void {
    this.keyboardShortcutService.commandPaletteVisible$.subscribe(visible => {
      if (visible && this.commandInput) {
        setTimeout(() => {
          this.commandInput.nativeElement.focus();
        }, 100);
      }
    });
  }

  initializeCommands(): void {
    this.commands = [
      {
        id: 'nav-dashboard',
        label: 'Aller au tableau de bord',
        description: 'Voir le tableau de bord principal',
        icon: 'dashboard',
        category: 'Navigation',
        action: () => this.navigateTo('/dashboard')
      },
      {
        id: 'nav-annonces',
        label: 'Aller aux annonces',
        description: 'Liste de toutes les annonces',
        icon: 'campaign',
        category: 'Navigation',
        action: () => this.navigateTo('/annonces')
      },
      {
        id: 'nav-dossiers',
        label: 'Aller aux dossiers',
        description: 'Liste de tous les dossiers',
        icon: 'folder',
        category: 'Navigation',
        action: () => this.navigateTo('/dossiers')
      },
      {
        id: 'nav-tasks',
        label: 'Aller aux tâches',
        description: 'Voir toutes les tâches',
        icon: 'task',
        category: 'Navigation',
        action: () => this.navigateTo('/tasks')
      },
      {
        id: 'nav-reports',
        label: 'Aller aux rapports',
        description: 'Voir les rapports et KPIs',
        icon: 'insights',
        category: 'Navigation',
        action: () => this.navigateTo('/reports')
      },
      {
        id: 'nav-observability',
        label: 'Aller à l\'observabilité',
        description: 'Dashboard d\'observabilité',
        icon: 'analytics',
        category: 'Navigation',
        action: () => this.navigateTo('/observability')
      },
      {
        id: 'nav-search',
        label: 'Rechercher',
        description: 'Rechercher des annonces et dossiers',
        icon: 'search',
        category: 'Navigation',
        action: () => this.navigateTo('/search')
      },
      {
        id: 'create-annonce',
        label: 'Créer une annonce',
        description: 'Créer une nouvelle annonce',
        icon: 'add_circle',
        category: 'Actions',
        action: () => this.navigateTo('/annonces/new')
      },
      {
        id: 'show-shortcuts',
        label: 'Afficher les raccourcis clavier',
        description: 'Voir tous les raccourcis disponibles',
        icon: 'keyboard',
        category: 'Aide',
        action: () => {
          this.close();
          this.keyboardShortcutService.toggleShortcutHelp();
        }
      }
    ];
  }

  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.filteredCommands = this.commands;
    } else {
      this.filteredCommands = this.commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
      );
    }
    
    this.selectedIndex = 0;
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredCommands[this.selectedIndex]) {
          this.executeCommand(this.filteredCommands[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  scrollToSelected(): void {
    setTimeout(() => {
      const selectedElement = document.querySelector('.command-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  executeCommand(command: Command): void {
    command.action();
    this.close();
  }

  selectCommand(index: number): void {
    this.selectedIndex = index;
  }

  close(): void {
    this.keyboardShortcutService.closeCommandPalette();
  }

  private navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getCategorizedCommands(): { category: string; commands: Command[] }[] {
    const categories = new Map<string, Command[]>();
    
    this.filteredCommands.forEach(cmd => {
      if (!categories.has(cmd.category)) {
        categories.set(cmd.category, []);
      }
      categories.get(cmd.category)?.push(cmd);
    });

    return Array.from(categories.entries()).map(([category, commands]) => ({
      category,
      commands
    }));
  }
}
