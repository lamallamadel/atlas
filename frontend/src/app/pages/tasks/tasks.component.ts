import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsBadgeComponent,
  DsCardComponent,
  DsTabsComponent,
  DsSkeletonComponent,
  DsEmptyStateComponent,
  DsFilterChipComponent,
  DsAvatarComponent,
  PageHeaderComponent,
} from '../../design-system/index';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
  dossierRef?: string;
  tags?: string[];
}

const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Appeler Marie Dupont pour confirmation RDV', status: 'todo',        priority: 'urgent', assignee: 'MD', dueDate: 'Aujourd\'hui', dossierRef: '#1042' },
  { id: 2, title: 'Envoyer compromis à Me. Leroy',              status: 'in_progress', priority: 'high',   assignee: 'PL', dueDate: 'Demain',      dossierRef: '#1039' },
  { id: 3, title: 'Mettre à jour photos annonce 3 pièces',      status: 'todo',        priority: 'medium', assignee: 'MD', dueDate: '6 mai' },
  { id: 4, title: 'Relancer prospect Jean Martin',              status: 'todo',        priority: 'high',   assignee: 'JM', dueDate: '7 mai',       dossierRef: '#1041' },
  { id: 5, title: 'Vérifier consentements RGPD Sophie B.',      status: 'done',        priority: 'medium', assignee: 'SB', dueDate: '1 mai',       dossierRef: '#1040' },
  { id: 6, title: 'Qualifier le budget de Paul Leroy',          status: 'done',        priority: 'low',    assignee: 'PL', dueDate: '30 avr.' },
  { id: 7, title: 'Publier annonce villa Cannes',               status: 'in_progress', priority: 'high',   assignee: 'MD', dueDate: '5 mai' },
  { id: 8, title: 'Archiver dossiers clôturés Q1',              status: 'cancelled',   priority: 'low',    assignee: 'SB', dueDate: '—' },
];

@Component({
  selector: 'app-tasks',
  standalone: true,
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  imports: [
    CommonModule, FormsModule,
    DsButtonComponent, DsBadgeComponent, DsCardComponent, DsTabsComponent,
    DsSkeletonComponent, DsEmptyStateComponent, DsFilterChipComponent,
    DsAvatarComponent, PageHeaderComponent,
  ],
})
export class TasksComponent implements OnInit {
  tasks: Task[] = MOCK_TASKS;
  loading = false;
  activeTab = 'all';
  searchQuery = '';
  priorityFilter: TaskPriority | '' = '';

  statusTabs = [
    { value: 'all',         label: 'Toutes',      badge: MOCK_TASKS.length },
    { value: 'todo',        label: 'À faire',     badge: MOCK_TASKS.filter(t => t.status === 'todo').length },
    { value: 'in_progress', label: 'En cours',    badge: MOCK_TASKS.filter(t => t.status === 'in_progress').length },
    { value: 'done',        label: 'Terminées',   badge: MOCK_TASKS.filter(t => t.status === 'done').length },
  ];

  priorityChips = [
    { key: 'urgent', label: '🔴 Urgent' },
    { key: 'high',   label: '🟠 Haute' },
    { key: 'medium', label: '🟡 Moyenne' },
    { key: 'low',    label: '⚪ Basse' },
  ];

  priorityBadge: Record<string, string> = {
    urgent: 'lost', high: 'rdv', medium: 'qualification', low: 'neutral',
  };

  ngOnInit(): void {}

  get filteredTasks(): Task[] {
    return this.tasks.filter(t => {
      const matchTab      = this.activeTab === 'all' || t.status === this.activeTab;
      const matchSearch   = !this.searchQuery || t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchPriority = !this.priorityFilter || t.priority === this.priorityFilter;
      return matchTab && matchSearch && matchPriority;
    });
  }

  get todoCount(): number { return this.tasks.filter(t => t.status === 'todo').length; }
  get doneRate(): number {
    const done = this.tasks.filter(t => t.status === 'done').length;
    return Math.round((done / this.tasks.length) * 100);
  }

  togglePriority(p: string): void {
    this.priorityFilter = this.priorityFilter === p ? '' : p as TaskPriority;
  }

  setDone(task: Task): void { task.status = 'done'; }

  getPriorityLabel(p: TaskPriority): string {
    return { urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Basse' }[p] ?? p;
  }
}
