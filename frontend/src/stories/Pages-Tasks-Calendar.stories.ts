import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageHeaderComponent } from '../app/design-system/patterns/page-header/page-header.component';
import { WeekGridComponent, WeekGridEvent } from '../app/design-system/patterns/week-grid/week-grid.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Événements sur une même journée (semaine affichée = celle du calendrier interne). */
const MOCK_EVENTS: WeekGridEvent[] = [
  {
    id: '1',
    title: 'Visite Villa Almadies',
    start: new Date(2026, 4, 6, 9, 0, 0),
    end: new Date(2026, 4, 6, 10, 0, 0),
    type: 'appointment',
    location: 'Almadies, Dakar',
  },
  {
    id: '2',
    title: 'RDV Aminata Diallo',
    start: new Date(2026, 4, 6, 14, 30, 0),
    end: new Date(2026, 4, 6, 15, 15, 0),
    type: 'appointment',
    location: 'Agence Pro Space',
  },
  {
    id: '3',
    title: 'Formation équipe',
    start: new Date(2026, 4, 6, 10, 0, 0),
    end: new Date(2026, 4, 6, 12, 0, 0),
    type: 'task',
    allDay: false,
  },
  {
    id: '4',
    title: 'Réunion pipeline',
    start: new Date(2026, 4, 6, 16, 0, 0),
    end: new Date(2026, 4, 6, 17, 0, 0),
    type: 'task',
  },
];

interface MockTask {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  priorityLabel: string;
  priorityBadge: 'lost' | 'warning' | 'active';
  done: boolean;
  dueDate: string;
  assignee?: string;
}

const MOCK_TASKS: MockTask[] = [
  { id: 1, title: 'Rappeler Moussa Konaté', priority: 'high', priorityLabel: 'Urgent', priorityBadge: 'lost', done: false, dueDate: 'Aujourd\'hui', assignee: 'AB' },
  { id: 2, title: 'Envoyer offre Villa Almadies', priority: 'high', priorityLabel: 'Urgent', priorityBadge: 'lost', done: false, dueDate: 'Aujourd\'hui' },
  { id: 3, title: 'Mettre à jour fiche annonce #8', priority: 'medium', priorityLabel: 'Normal', priorityBadge: 'warning', done: false, dueDate: 'Demain', assignee: 'MD' },
  { id: 4, title: 'Préparer dossier financement', priority: 'medium', priorityLabel: 'Normal', priorityBadge: 'warning', done: true, dueDate: '5 mai', assignee: 'AB' },
  { id: 5, title: 'Archiver dossiers clôturés', priority: 'low', priorityLabel: 'Faible', priorityBadge: 'active', done: false, dueDate: '10 mai' },
];

@Component({
  selector: 'sb-tasks-mock',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, DsBadgeComponent, DsButtonComponent,
    DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div style="padding:32px; max-width:960px; margin:0 auto; background:var(--ds-bg); min-height:100vh;">
      <ds-page-header
        eyebrow="Espace Pro" titleBefore="Mes" titleAccent="tâches"
        description="Gérez vos actions quotidiennes et suivez vos priorités.">
        <ng-container slot="actions">
          <ds-button variant="ghost" size="sm">Tout marquer fait</ds-button>
          <ds-button variant="marine" size="md">+ Nouvelle tâche</ds-button>
        </ng-container>
      </ds-page-header>

      @if (loading) {
        <div style="display:flex;flex-direction:column;gap:8px;">
          @for (i of [1,2,3,4]; track i) {
            <ds-skeleton variant="rect" height="56px"></ds-skeleton>
          }
        </div>
      } @else if (empty) {
        <ds-empty-state
          title="Aucune tâche"
          description="Votre liste est vide. Créez une nouvelle tâche pour commencer."
          ctaLabel="Nouvelle tâche">
        </ds-empty-state>
      } @else {
        <!-- Groupes par priorité -->
        <div style="display:flex;flex-direction:column;gap:24px;">
          @for (group of taskGroups; track group.label) {
            <section>
              <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ds-text-faint);margin-bottom:8px;">{{ group.label }}</h3>
              <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;">
                @for (t of group.tasks; track t.id) {
                  <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--ds-divider);">
                    <input type="checkbox" [checked]="t.done" style="width:18px;height:18px;cursor:pointer;" />
                    <div style="flex:1;" [style.textDecoration]="t.done ? 'line-through' : 'none'" [style.opacity]="t.done ? '0.5' : '1'">
                      <div style="font-size:13.5px;font-weight:600;">{{ t.title }}</div>
                      <div style="font-size:11.5px;color:var(--ds-text-faint);">Échéance : {{ t.dueDate }}</div>
                    </div>
                    <ds-badge [status]="t.priorityBadge" size="sm">{{ t.priorityLabel }}</ds-badge>
                    @if (t.assignee) {
                      <div style="width:28px;height:28px;border-radius:50%;background:var(--ds-marine);color:var(--ds-text-inverse);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">{{ t.assignee }}</div>
                    }
                    <button style="width:32px;height:32px;border:1px solid var(--ds-divider);border-radius:6px;background:transparent;cursor:pointer;color:var(--ds-text-muted);" aria-label="Modifier">✏️</button>
                  </div>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
})
class TasksMockComponent {
  @Input() loading = false;
  @Input() empty = false;
  get taskGroups() {
    return [
      { label: 'Urgent', tasks: MOCK_TASKS.filter(t => t.priority === 'high') },
      { label: 'Normal', tasks: MOCK_TASKS.filter(t => t.priority === 'medium') },
      { label: 'Faible priorité', tasks: MOCK_TASKS.filter(t => t.priority === 'low') },
    ];
  }
}

@Component({
  selector: 'sb-calendar-mock',
  standalone: true,
  imports: [
    CommonModule, PageHeaderComponent, WeekGridComponent, DsButtonComponent,
  ],
  template: `
    <div style="padding:32px; max-width:1200px; margin:0 auto; background:var(--ds-bg); min-height:100vh;">
      <ds-page-header
        eyebrow="Espace Pro" titleBefore="Mon" titleAccent="calendrier"
        description="Planifiez vos visites, rendez-vous et formations.">
        <ng-container slot="actions">
          <ds-button variant="ghost" size="sm">Aujourd'hui</ds-button>
          <ds-button variant="marine" size="md">+ Événement</ds-button>
        </ng-container>
      </ds-page-header>
      <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;margin-top:8px;">
        <ds-week-grid [events]="events"></ds-week-grid>
      </div>
    </div>
  `,
})
class CalendarMockComponent {
  events = MOCK_EVENTS;
}

/* ── Meta ── */
const meta: Meta = {
  title: 'Pages/Tâches & Calendrier',
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
  ],
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const ListeTâches: StoryObj<TasksMockComponent> = {
  decorators: [moduleMetadata({ imports: [TasksMockComponent] })],
  render: () => ({ template: '<sb-tasks-mock></sb-tasks-mock>' }),
};

export const TâchesVide: StoryObj<TasksMockComponent> = {
  decorators: [moduleMetadata({ imports: [TasksMockComponent] })],
  render: () => ({ template: '<sb-tasks-mock [empty]="true"></sb-tasks-mock>' }),
};

export const CalendrierSemaine: StoryObj<CalendarMockComponent> = {
  decorators: [moduleMetadata({ imports: [CalendarMockComponent] })],
  render: () => ({ template: '<sb-calendar-mock></sb-calendar-mock>' }),
};
