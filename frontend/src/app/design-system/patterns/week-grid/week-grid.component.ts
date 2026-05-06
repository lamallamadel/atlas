import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';

export type WeekGridEventType = 'appointment' | 'task' | 'reminder' | 'block';

export interface WeekGridEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  type: WeekGridEventType;
  color?: string;
  location?: string;
  assigneeInitials?: string;
  dossierRef?: string;
  allDay?: boolean;
}

export interface WeekGridClickEvent {
  date: Date;
  hour?: number;
}

const TYPE_COLORS: Record<WeekGridEventType, { bg: string; text: string; border: string }> = {
  appointment: { bg: 'var(--ds-marine-hl)',     text: 'var(--ds-marine)',   border: 'var(--ds-marine)' },
  task:        { bg: 'var(--ds-primary-subtle)', text: 'var(--ds-primary)', border: 'var(--ds-primary)' },
  reminder:    { bg: 'var(--ds-warning-hl)',       text: 'var(--ds-warning)', border: 'var(--ds-warning)' },
  block:       { bg: 'var(--ds-surface-offset)', text: 'var(--ds-text-faint)', border: 'var(--ds-divider)' },
};

@Component({
  selector: 'ds-week-grid',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    <div class="wg" role="grid" [attr.aria-label]="'Calendrier semaine du ' + weekLabel">

      <!-- ── Navigation semaine ── -->
      <div class="wg__nav">
        <button class="wg__nav-btn" (click)="prevWeek()" aria-label="Semaine précédente">
          <ds-icon name="chevron-left" [size]="16"></ds-icon>
        </button>
        <span class="wg__week-label">{{ weekLabel }}</span>
        <button class="wg__nav-btn wg__nav-btn--today" (click)="goToToday()" aria-label="Aujourd'hui">
          Auj.
        </button>
        <button class="wg__nav-btn" (click)="nextWeek()" aria-label="Semaine suivante">
          <ds-icon name="chevron-right" [size]="16"></ds-icon>
        </button>
      </div>

      <!-- ── Grille ── -->
      <div class="wg__grid">

        <!-- En-têtes jours -->
        <div class="wg__time-gutter"></div>
        @for (day of weekDays; track day.date.toISOString()) {
          <div class="wg__day-header" [class.wg__day-header--today]="day.isToday" role="columnheader">
            <span class="wg__day-name">{{ day.dayName }}</span>
            <span class="wg__day-num" [class.wg__day-num--today]="day.isToday">{{ day.dayNum }}</span>
            <!-- All-day events -->
            @if (day.allDayEvents.length > 0) {
              <div class="wg__all-day">
                @for (evt of day.allDayEvents; track evt.id) {
                  <div class="wg__all-day-evt"
                    [style.background]="getColor(evt.type).bg"
                    [style.color]="getColor(evt.type).text"
                    [style.border-left]="'3px solid ' + getColor(evt.type).border"
                    (click)="eventClick.emit(evt)"
                    [title]="evt.title">
                    {{ evt.title }}
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Lignes horaires -->
        @for (hour of hours; track hour) {
          <!-- Gutter heure -->
          <div class="wg__hour-label" [attr.aria-label]="hour + 'h00'">
            {{ hour < 10 ? '0' + hour : hour }}:00
          </div>

          <!-- Cellules par jour -->
          @for (day of weekDays; track day.date.toISOString()) {
            <div
              class="wg__cell"
              [class.wg__cell--today]="day.isToday"
              role="gridcell"
              [attr.aria-label]="day.dayName + ' ' + hour + 'h'"
              (click)="onCellClick(day.date, hour)">

              <!-- Événements dans cette cellule -->
              @for (evt of getCellEvents(day.date, hour); track evt.id) {
                <div
                  class="wg__evt"
                  [class]="'wg__evt--' + evt.type"
                  [style.background]="getColor(evt.type).bg"
                  [style.color]="getColor(evt.type).text"
                  [style.border-left-color]="getColor(evt.type).border"
                  [style.height.px]="getEventHeight(evt)"
                  [title]="evt.title + (evt.location ? ' — ' + evt.location : '')"
                  (click)="$event.stopPropagation(); eventClick.emit(evt)"
                  role="button"
                  [attr.tabindex]="0"
                  [attr.aria-label]="evt.title + ' à ' + formatTime(evt.start)">
                  <div class="wg__evt-title">{{ evt.title }}</div>
                  @if (evt.location) {
                    <div class="wg__evt-loc">
                      <ds-icon name="map" [size]="16"></ds-icon>
                      {{ evt.location }}
                    </div>
                  }
                  @if (evt.dossierRef) {
                    <span class="wg__evt-ref">{{ evt.dossierRef }}</span>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

    </div>
  `,
  styleUrls: ['./week-grid.component.scss'],
})
export class WeekGridComponent implements OnChanges {
  @Input() events: WeekGridEvent[] = [];
  @Input() currentDate = new Date();
  @Input() startHour = 8;
  @Input() endHour = 19;

  @Output() eventClick = new EventEmitter<WeekGridEvent>();
  @Output() cellClick  = new EventEmitter<WeekGridClickEvent>();

  weekDays: Array<{
    date: Date;
    dayName: string;
    dayNum: number;
    isToday: boolean;
    allDayEvents: WeekGridEvent[];
  }> = [];

  hours: number[] = [];
  weekLabel = '';
  private today = new Date();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate'] || changes['events']) {
      this.buildWeek();
    }
    if (changes['startHour'] || changes['endHour']) {
      this.buildHours();
    }
  }

  prevWeek(): void {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - 7);
    this.currentDate = d;
    this.buildWeek();
    this.weekChange.emit(this.currentDate);
  }

  nextWeek(): void {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + 7);
    this.currentDate = d;
    this.buildWeek();
    this.weekChange.emit(this.currentDate);
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.buildWeek();
    this.weekChange.emit(this.currentDate);
  }

  @Output() weekChange = new EventEmitter<Date>();

  onCellClick(date: Date, hour: number): void {
    this.cellClick.emit({ date, hour });
  }

  getCellEvents(date: Date, hour: number): WeekGridEvent[] {
    return this.events.filter(evt => {
      if (evt.allDay) return false;
      const sameDay = this.isSameDay(evt.start, date);
      const startHour = evt.start.getHours();
      return sameDay && startHour === hour;
    });
  }

  getEventHeight(evt: WeekGridEvent): number {
    const durationMs = evt.end.getTime() - evt.start.getTime();
    const durationH  = durationMs / (1000 * 60 * 60);
    return Math.max(40, durationH * 52);
  }

  getColor(type: WeekGridEventType) {
    return TYPE_COLORS[type] ?? TYPE_COLORS.appointment;
  }

  formatTime(date: Date): string {
    const h = date.getHours();
    const m = date.getMinutes();
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
  }

  private buildWeek(): void {
    const monday = this.getMondayOf(this.currentDate);
    this.buildHours();
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date,
        dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        dayNum:  date.getDate(),
        isToday: this.isSameDay(date, this.today),
        allDayEvents: this.events.filter(e => e.allDay && this.isSameDay(e.start, date)),
      };
    });

    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 6);
    this.weekLabel = `${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  private buildHours(): void {
    this.hours = Array.from(
      { length: this.endHour - this.startHour },
      (_, i) => this.startHour + i,
    );
  }

  private getMondayOf(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
  }
}
