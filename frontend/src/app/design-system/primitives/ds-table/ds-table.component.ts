import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DsSkeletonComponent } from '../ds-skeleton/ds-skeleton.component';
import { DsButtonComponent } from '../ds-button/ds-button.component';
import { DsIconComponent } from '../../icons/ds-icon.component';
import { DsCellDirective } from './ds-cell.directive';

export interface DsColumn<T = Record<string, any>> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  cell?: (row: T) => string;
}

export interface DsSortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DsRowAction<T = Record<string, any>> {
  icon?: string;
  label: string;
  action: string;
  ariaLabel?: string;
  show?: (row: T) => boolean;
}

@Component({
  selector: 'ds-table',
  standalone: true,
  imports: [CommonModule, DsSkeletonComponent, DsButtonComponent, DsIconComponent, NgTemplateOutlet],
  template: `
    <div class="ds-table-wrap" [class.ds-table-wrap--bordered]="bordered">
      <table class="ds-table" [attr.aria-label]="label">
        <thead class="ds-table__head">
          <tr>
            @if (selectableRows) {
              <th class="ds-table__th ds-table__th--select">
                <input
                  type="checkbox"
                  class="ds-table__checkbox"
                  [checked]="isAllRowsSelected()"
                  (click)="$event.stopPropagation()"
                  (change)="toggleAllRows($event)"
                  aria-label="Sélectionner toutes les lignes" />
              </th>
            }
            @for (col of columns; track col.key) {
              <th
                class="ds-table__th"
                [class.ds-table__th--sortable]="col.sortable"
                [class.ds-table__th--sorted]="sortColumn === col.key"
                [style.width]="col.width"
                [style.text-align]="col.align || 'left'"
                [attr.aria-sort]="col.sortable ? (sortColumn === col.key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none') : null"
                (click)="col.sortable && onSort(col.key)">
                <span class="ds-table__th-label">{{ col.header }}</span>
                @if (col.sortable) {
                  <span class="ds-table__sort-icon" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      @if (sortColumn !== col.key || sortDirection === 'asc') {
                        <path d="M6 3l3 3H3l3-3z" fill="currentColor" [attr.opacity]="sortColumn === col.key ? 1 : 0.4"/>
                      }
                      @if (sortColumn !== col.key || sortDirection === 'desc') {
                        <path d="M6 9L3 6h6L6 9z" fill="currentColor" [attr.opacity]="sortColumn === col.key ? 1 : 0.4"/>
                      }
                    </svg>
                  </span>
                }
              </th>
            }
            @if (rowActions.length > 0) {
              <th class="ds-table__th ds-table__th--actions">Actions</th>
            }
          </tr>
        </thead>
        <tbody class="ds-table__body">
          @if (loading) {
            @for (i of skeletonRows; track i) {
              <tr class="ds-table__row ds-table__row--skeleton">
                @if (selectableRows) {
                  <td class="ds-table__td"></td>
                }
                @for (col of columns; track col.key) {
                  <td class="ds-table__td">
                    <ds-skeleton variant="text" width="80%"></ds-skeleton>
                  </td>
                }
                @if (rowActions.length > 0) {
                  <td class="ds-table__td"></td>
                }
              </tr>
            }
          } @else if (rows.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (selectableRows ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)" class="ds-table__empty">
                <div style="padding: 48px 0; text-align: center;">
                  <span style="color: var(--ds-text-faint);">{{ emptyMessage }}</span>
                </div>
              </td>
            </tr>
          } @else {
            @for (row of rows; track trackByFn($index, row)) {
              <tr
                class="ds-table__row"
                [class.ds-table__row--clickable]="rowClickable"
                [attr.tabindex]="rowClickable ? 0 : null"
                (click)="rowClickable && rowClick.emit(row)"
                (keydown.enter)="rowClickable && rowClick.emit(row)">
                @if (selectableRows) {
                  <td class="ds-table__td ds-table__td--select">
                    <input
                      type="checkbox"
                      class="ds-table__checkbox"
                      [checked]="isRowSelected(row)"
                      (click)="$event.stopPropagation()"
                      (change)="toggleRowSelection(row, $event)"
                      [attr.aria-label]="'Sélectionner la ligne ' + ($index + 1)" />
                  </td>
                }
                @for (col of columns; track col.key) {
                  <td
                    class="ds-table__td"
                    [style.text-align]="col.align || 'left'">
                    @if (getTemplate(col.key)) {
                      <ng-container *ngTemplateOutlet="getTemplate(col.key)!; context: { $implicit: row }"></ng-container>
                    } @else if (col.cell) {
                      <span [innerHTML]="safeCell(col, row)"></span>
                    } @else {
                      {{ getCellValue(row, col.key) }}
                    }
                  </td>
                }
                @if (rowActions.length > 0) {
                  <td class="ds-table__td ds-table__td--actions">
                    <div style="display: flex; gap: 4px; justify-content: flex-end;">
                      @for (action of getVisibleActions(row); track action.action) {
                        <ds-button
                          variant="icon"
                          size="sm"
                          [ariaLabel]="action.ariaLabel || action.label"
                          (dsClick)="onRowAction(row, action.action, $event)">
                          @if (action.icon) {
                            <ds-icon [name]="action.icon" [size]="20"></ds-icon>
                          } @else {
                            <span>{{ action.label }}</span>
                          }
                        </ds-button>
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>

      @if (showPagination && paginationData) {
        <div class="ds-table__pagination" style="display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 12px 24px; border-top: 1px solid var(--ds-divider); background: var(--ds-surface-2);">
          <span style="font-size: 13px; color: var(--ds-text-faint);">
            {{ (paginationData.number * paginationData.size) + 1 }}-{{ Math.min((paginationData.number + 1) * paginationData.size, paginationData.totalElements) }} sur {{ paginationData.totalElements }}
          </span>
          <div style="display: flex; gap: 4px;">
            <ds-button variant="icon" size="sm" [disabled]="paginationData.first" (dsClick)="paginationChange.emit('previous')">
              <ds-icon name="chevron-left" [size]="16"></ds-icon>
            </ds-button>
            <ds-button variant="icon" size="sm" [disabled]="paginationData.last" (dsClick)="paginationChange.emit('next')">
              <ds-icon name="chevron-right" [size]="16"></ds-icon>
            </ds-button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./ds-table.component.scss'],
})
export class DsTableComponent<T extends Record<string, any> = Record<string, any>> implements AfterContentInit {
  constructor(private sanitizer: DomSanitizer) {}
  @Input() columns: DsColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() loading = false;
  @Input() loadingRowCount = 5;
  @Input() bordered = false;
  @Input() rowClickable = false;
  @Input() label = 'Tableau de données';
  @Input() emptyMessage = 'Aucune donnée disponible';
  @Input() sortColumn = '';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Input() trackBy: ((index: number, row: T) => unknown) | null = null;
  @Input() rowActions: DsRowAction<T>[] = [];
  @Input() selectableRows = false;
  @Input() selectedRows: T[] = [];
  
  @Input() showPagination = false;
  @Input() paginationData?: any;

  @Output() sort = new EventEmitter<DsSortEvent>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() rowAction = new EventEmitter<{ action: string; row: T }>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() paginationChange = new EventEmitter<'next' | 'previous'>();

  @ContentChildren(DsCellDirective) cellTemplates!: QueryList<DsCellDirective>;
  private templateMap = new Map<string, any>();

  Math = Math;

  ngAfterContentInit(): void {
    this.updateTemplateMap();
    this.cellTemplates.changes.subscribe(() => this.updateTemplateMap());
  }

  private updateTemplateMap(): void {
    this.templateMap.clear();
    this.cellTemplates.forEach(directive => {
      this.templateMap.set(directive.key, directive.template);
    });
  }

  getTemplate(key: string): any {
    return this.templateMap.get(key);
  }

  safeCell(col: DsColumn<any>, row: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(col.cell!(row));
  }

  get skeletonRows(): number[] {
    return Array.from({ length: this.loadingRowCount }, (_, i) => i);
  }

  onSort(column: string): void {
    const direction: 'asc' | 'desc' =
      this.sortColumn === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortColumn = column;
    this.sortDirection = direction;
    this.sort.emit({ column, direction });
  }

  trackByFn(index: number, row: T): unknown {
    return this.trackBy ? this.trackBy(index, row) : index;
  }

  getCellValue(row: T, key: string): unknown {
    return row[key] ?? '—';
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows.includes(row);
  }

  isAllRowsSelected(): boolean {
    return this.rows.length > 0 && this.selectedRows.length === this.rows.length;
  }

  toggleRowSelection(row: T, event: Event): void {
    event.stopPropagation();
    if (this.isRowSelected(row)) {
      this.selectionChange.emit(this.selectedRows.filter((selected) => selected !== row));
      return;
    }
    this.selectionChange.emit([...this.selectedRows, row]);
  }

  toggleAllRows(event: Event): void {
    event.stopPropagation();
    if (this.isAllRowsSelected()) {
      this.selectionChange.emit([]);
      return;
    }
    this.selectionChange.emit([...this.rows]);
  }

  getVisibleActions(row: T): DsRowAction<T>[] {
    return this.rowActions.filter((action) => !action.show || action.show(row));
  }

  onRowAction(row: T, action: string, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ action, row });
  }
}
