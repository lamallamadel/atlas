import { Component, OnInit, OnChanges, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { listStaggerAnimation } from '../animations';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsCardComponent, 
  DsCheckboxComponent,
  DsBadgeComponent,
  DsTableComponent,
  DsColumn,
  DsRowAction,
  DsSkeletonComponent,
  DsEmptyStateComponent
} from '../design-system';

export interface ColumnConfig {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'avatar';
  sortable?: boolean;
}

export interface RowAction<T> {
  icon: string;
  tooltip: string;
  action: string;
  color?: string;
  show?: (row: T) => boolean;
}

export interface PaginationData {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss'],
  animations: [listStaggerAnimation],
  imports: [
    CommonModule, 
    FormsModule, 
    ScrollingModule,
    DsButtonComponent, 
    DsIconComponent, 
    DsCardComponent, 
    DsCheckboxComponent,
    DsBadgeComponent,
    DsTableComponent,
    DsSkeletonComponent,
    DsEmptyStateComponent
  ],
})
export class GenericTableComponent implements OnInit, OnChanges, OnDestroy {
  readonly columns = input<ColumnConfig[]>([]);
  readonly data = input<any[]>([]);
  readonly loading = input(false);
  readonly rowClickable = input(false);
  readonly actions = input<RowAction<any>[]>([]);
  readonly showActions = input(true);
  readonly enableRowSelection = input(false);
  readonly enableExport = input(false);
  readonly showTableHeader = input(true);
  readonly showPagination = input(false);
  readonly showInlinePagination = input(false);
  readonly paginationData = input<PaginationData | null>(null);
  readonly counterSingular = input('élément');
  readonly counterPlural = input('éléments');
  readonly enableVirtualScroll = input(false);
  readonly virtualScrollItemSize = input(120);

  readonly rowClick = output<any>();
  readonly actionTriggered = output<{ action: string; row: any }>();
  readonly selectionChange = output<any[]>();
  readonly paginationChange = output<'next' | 'previous'>();

  selection = new SelectionModel<any>(true, []);
  isMobile = false;

  dsColumns: DsColumn<any>[] = [];
  dsRows: any[] = [];
  dsRowActions: DsRowAction<any>[] = [];
  dsSelectedRows: any[] = [];

  dsClientPageNumber = 1;
  dsClientTotalPages = 1;

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnChanges(): void {
    this.updateDsData();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.checkMobile());
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private updateDsData(): void {
    this.dsColumns = this.columns().map(c => ({
      key: c.key,
      header: c.header,
      sortable: c.sortable ?? false
    }));

    this.dsRows = this.data();

    this.dsRowActions = this.actions().map(a => ({
      icon: a.icon,
      label: a.tooltip,
      action: a.action,
      ariaLabel: a.tooltip,
      show: a.show
    }));

    if (this.showPagination() && !this.showInlinePagination()) {
      this.dsClientTotalPages = Math.ceil(this.data().length / 10) || 1;
    }
  }

  onRowClick(row: any): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  onAction(action: string, row: any): void {
    this.actionTriggered.emit({ action, row });
  }

  onPaginationChange(direction: 'next' | 'previous'): void {
    if (this.showInlinePagination()) {
      this.paginationChange.emit(direction);
    } else {
      if (direction === 'next' && this.dsClientPageNumber < this.dsClientTotalPages) {
        this.dsClientPageNumber++;
      } else if (direction === 'previous' && this.dsClientPageNumber > 1) {
        this.dsClientPageNumber--;
      }
    }
  }

  toggleRow(row: any): void {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection.selected);
    this.dsSelectedRows = [...this.selection.selected];
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dsRows.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dsRows.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
    this.dsSelectedRows = [...this.selection.selected];
  }

  hasSelection(): boolean {
    return this.selection.hasValue();
  }

  getSelectedCount(): number {
    return this.selection.selected.length;
  }

  onDsSelectionChange(selected: any[]): void {
    this.selection.clear();
    selected.forEach(row => this.selection.select(row));
    this.selectionChange.emit(selected);
  }

  onDsSort(event: any): void {
    // Basic client-side sort for demo
    const { key, direction } = event;
    if (!direction) return;
    
    this.dsRows = [...this.dsRows].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getRowValue(row: any, key: string): any {
    return row[key];
  }

  formatValue(value: any, _column: ColumnConfig, _row: any): string {
    if (value == null) return '—';
    return String(value);
  }

  trackByRowId(index: number, row: any): any {
    return row.id || index;
  }

  trackByColumnKey(index: number, col: ColumnConfig): string {
    return col.key;
  }

  trackByAction(index: number, action: RowAction<any>): string {
    return action.action;
  }

  shouldShowAction(action: RowAction<any>, row: any): boolean {
    return action.show ? action.show(row) : true;
  }

  exportToPDF(): void { /* ... */ }
  exportToExcel(): void { /* ... */ }
  printTable(): void { /* ... */ }
}
