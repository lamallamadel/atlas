import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPlaceholder,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DsBadgeComponent, DsBadgeStatus } from '../../primitives/ds-badge/ds-badge.component';
import { DsAvatarComponent } from '../../primitives/ds-avatar/ds-avatar.component';
import { DsSkeletonComponent } from '../../primitives/ds-skeleton/ds-skeleton.component';
import { DsIconComponent } from '../../icons/ds-icon.component';

export type DsKanbanStatus = string;

export interface DsKanbanCard {
  id: string | number;
  title: string;
  subtitle?: string;
  status: DsKanbanStatus;
  badge?: string;
  badgeStatus?: DsBadgeStatus;
  assigneeInitials?: string;
  assigneeName?: string;
  dueDate?: string;
  dueDateUrgent?: boolean;
  tags?: string[];
  meta?: Record<string, string>;
}

export interface DsKanbanColumn {
  id: DsKanbanStatus;
  label: string;
  color?: 'marine' | 'copper' | 'success' | 'warning' | 'error' | 'neutral';
  limit?: number;
  cards: DsKanbanCard[];
  allowedSources?: DsKanbanStatus[];
}

export interface DsKanbanDropEvent {
  card: DsKanbanCard;
  fromColumn: DsKanbanStatus;
  toColumn: DsKanbanStatus;
  newIndex: number;
}

/**
 * ds-kanban-column — Colonne Kanban Atlasia DS.
 *
 * Chaque colonne est une `CdkDropList` connectée aux autres via `[cdkDropListConnectedTo]`.
 * Le composant parent (ds-kanban-board ou page) gère les connexions entre colonnes.
 *
 * Usage :
 * ```html
 * <ds-kanban-column
 *   [column]="col"
 *   [connectedTo]="allColumnIds"
 *   [loading]="loading"
 *   (cardClick)="onCardClick($event)"
 *   (cardDropped)="onCardDropped($event)">
 * </ds-kanban-column>
 * ```
 */
@Component({
  selector: 'ds-kanban-column',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder,
    DsBadgeComponent, DsAvatarComponent, DsSkeletonComponent, DsIconComponent,
  ],
  template: `
    <div class="dsk-col" [class]="'dsk-col--' + (column.color || 'neutral')">
      <!-- ── En-tête de colonne ── -->
      <div class="dsk-col__header">
        <div class="dsk-col__header-left">
          <span class="dsk-col__dot" aria-hidden="true"></span>
          <h2 class="dsk-col__title">{{ column.label }}</h2>
          <span class="dsk-col__count" aria-label="{{ column.cards.length }} cartes">
            {{ column.cards.length }}
          </span>
        </div>
        @if (column.limit) {
          <span class="dsk-col__limit" [class.dsk-col__limit--exceeded]="column.cards.length > column.limit"
            aria-label="Limite : {{ column.limit }}">
            / {{ column.limit }}
          </span>
        }
      </div>

      <!-- ── Zone drop ── -->
      <div
        class="dsk-col__drop-zone"
        cdkDropList
        [id]="'dsk-' + column.id"
        [cdkDropListData]="column.cards"
        [cdkDropListConnectedTo]="connectedTo"
        (cdkDropListDropped)="onDrop($event)"
        [attr.aria-label]="'Colonne ' + column.label">

        <!-- Squelettes chargement -->
        @if (loading) {
          @for (s of skeletonItems; track s) {
            <ds-skeleton variant="card" height="88px" style="margin-bottom:8px"></ds-skeleton>
          }
        }

        <!-- État vide -->
        @if (!loading && column.cards.length === 0) {
          <div class="dsk-col__empty" aria-live="polite">
            <ds-icon name="folder" [size]="20" style="color:var(--ds-text-faint)"></ds-icon>
            <span>Aucune carte</span>
          </div>
        }

        <!-- Cartes -->
        @for (card of column.cards; track card.id) {
          <div
            class="dsk-card"
            cdkDrag
            [cdkDragData]="card"
            [attr.tabindex]="0"
            [attr.role]="'article'"
            [attr.aria-label]="card.title"
            (click)="cardClick.emit(card)"
            (keydown.enter)="cardClick.emit(card)">

            <!-- Drag handle -->
            <div class="dsk-card__handle" cdkDragHandle aria-label="Déplacer la carte" title="Glisser pour déplacer">
              <ds-icon name="filter" [size]="20"></ds-icon>
            </div>

            <!-- Contenu -->
            <div class="dsk-card__body">
              <div class="dsk-card__title">{{ card.title }}</div>
              @if (card.subtitle) {
                <div class="dsk-card__subtitle">{{ card.subtitle }}</div>
              }

              <!-- Tags -->
              @if (card.tags && card.tags.length > 0) {
                <div class="dsk-card__tags">
                  @for (tag of card.tags; track tag) {
                    <span class="dsk-card__tag">{{ tag }}</span>
                  }
                </div>
              }

              <!-- Footer -->
              <div class="dsk-card__footer">
                @if (card.dueDate) {
                  <span class="dsk-card__due" [class.dsk-card__due--urgent]="card.dueDateUrgent">
                    <ds-icon name="calendar" [size]="16"></ds-icon>
                    {{ card.dueDate }}
                  </span>
                }
                <div class="dsk-card__footer-right">
                  @if (card.badgeStatus) {
                    <ds-badge [status]="card.badgeStatus" size="sm">{{ card.badge }}</ds-badge>
                  }
                  @if (card.assigneeInitials) {
                    <ds-avatar
                      [name]="card.assigneeInitials"
                      size="sm">
                    </ds-avatar>
                  }
                </div>
              </div>
            </div>

            <!-- Placeholder drag -->
            <div *cdkDragPlaceholder class="dsk-card--placeholder"></div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./kanban-column.component.scss'],
})
export class KanbanColumnComponent {
  @Input() column!: DsKanbanColumn;
  @Input() connectedTo: string[] = [];
  @Input() loading = false;
  readonly skeletonItems = [1, 2, 3];

  @Output() cardClick = new EventEmitter<DsKanbanCard>();
  @Output() cardDropped = new EventEmitter<DsKanbanDropEvent>();

  onDrop(event: CdkDragDrop<DsKanbanCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const card = event.previousContainer.data[event.previousIndex];
      const fromColumnId = event.previousContainer.id.replace('dsk-', '');
      const toColumnId   = event.container.id.replace('dsk-', '');

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      this.cardDropped.emit({
        card,
        fromColumn: fromColumnId,
        toColumn:   toColumnId,
        newIndex:   event.currentIndex,
      });
    }
  }
}
