import { Component, OnInit, OnChanges, SimpleChanges, OnDestroy, input, output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { listStaggerAnimation } from '../animations/list-animations';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { DsCardComponent } from '../design-system';
import { DS_CHART_FALLBACK_HEX } from '../design-system/chart-ds-colors';
import { DsTableComponent, DsColumn, DsRowAction, DsSortEvent } from '../design-system/primitives/ds-table/ds-table.component';

export interface ColumnConfig {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  format?: (value: unknown, row: unknown) => string;
  resizable?: boolean;
  width?: string;
  minWidth?: string;
}

export interface RowAction {
  icon: string;
  tooltip: string;
  action: 'view' | 'edit' | 'delete' | string;
  color?: string;
  show?: (row: unknown) => boolean;
}

export interface PaginationData {
  number: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Component({
    selector: 'app-generic-table',
    templateUrl: './generic-table.component.html',
    styleUrls: ['./generic-table.component.scss'],
    animations: [listStaggerAnimation],
    imports: [MatIconButton, MatIcon, MatCheckbox, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, DsCardComponent, DsTableComponent]
})
export class GenericTableComponent implements OnInit, OnChanges, OnDestroy {
  readonly columns = input<ColumnConfig[]>([]);
  readonly data = input<unknown[]>([]);
  readonly showActions = input(true);
  readonly actions = input<RowAction[]>([
    { icon: 'visibility', tooltip: 'Voir', action: 'view', color: 'primary' },
    { icon: 'edit', tooltip: 'Modifier', action: 'edit', color: 'accent' },
    { icon: 'delete', tooltip: 'Supprimer', action: 'delete', color: 'warn' }
  ]);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50, 100]);
  readonly showPagination = input(true);
  readonly enableSort = input(true);
  readonly rowClickable = input(false);
  readonly enableRowSelection = input(false);
  readonly stickyHeader = input(true);
  readonly enableVirtualScroll = input(false);
  readonly virtualScrollItemSize = input(48);
  readonly useKebabMenu = input(false);
  readonly showTableHeader = input(false);
  readonly showInlinePagination = input(false);
  readonly loading = input(false);
  readonly paginationData = input<PaginationData>();
  readonly counterSingular = input('élément');
  readonly counterPlural = input('éléments');
  readonly enableExport = input(false);
  readonly exportConfig = input<{
    title?: string;
    filename?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>();

  readonly rowAction = output<{
    action: string;
    row: unknown;
  }>();
  readonly rowClick = output<unknown>();
  readonly selectionChange = output<unknown[]>();
  readonly paginationChange = output<'previous' | 'next'>();
  readonly exportRequest = output<{
    format: 'pdf' | 'excel' | 'print';
    data: unknown[];
  }>();

  dataSource = new MatTableDataSource<unknown>([]);
  selection = new SelectionModel<unknown>(true, []);
  isMobile = false;
  currentClientPage = 0;
  
  private destroy$ = new Subject<void>();

  get dsColumns(): DsColumn<Record<string, unknown>>[] {
    return this.columns().map((column) => ({
      key: column.key,
      header: column.header,
      sortable: column.sortable !== false && this.enableSort(),
      width: column.width,
      cell: (row: Record<string, unknown>) => this.formatValue(row[column.key], column, row),
    }));
  }

  get dsRows(): Record<string, unknown>[] {
    if (!this.showPagination() || this.showInlinePagination()) {
      return this.dataSource.data as Record<string, unknown>[];
    }
    const pageSize = this.pageSize();
    const start = this.currentClientPage * pageSize;
    return this.dataSource.data.slice(start, start + pageSize) as Record<string, unknown>[];
  }

  get dsSelectedRows(): Record<string, unknown>[] {
    return this.selection.selected as Record<string, unknown>[];
  }

  get dsClientTotalPages(): number {
    if (!this.showPagination() || this.showInlinePagination()) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.dataSource.data.length / this.pageSize()));
  }

  get dsClientPageNumber(): number {
    return this.currentClientPage + 1;
  }

  get dsRowActions(): DsRowAction<Record<string, unknown>>[] {
    if (!this.showActions()) {
      return [];
    }
    return this.actions().map((action) => ({
      action: action.action,
      label: action.tooltip,
      ariaLabel: action.tooltip || action.action,
      icon: this.mapMaterialIconToDs(action.icon),
      show: action.show as ((row: Record<string, unknown>) => boolean) | undefined,
    }));
  }

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.dataSource.data = this.data();
    this.observeBreakpoints();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data();
      this.selection.clear();
      this.currentClientPage = 0;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  observeBreakpoints(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  onAction(action: string, row: unknown): void {
    this.rowAction.emit({ action, row });
  }

  shouldShowAction(action: RowAction, row: unknown): boolean {
    if (action.show) {
      return action.show(row);
    }
    return true;
  }

  formatValue(value: unknown, column: ColumnConfig, row: unknown): string {
    if (column.format) {
      return column.format(value, row);
    }

    if (value === null || value === undefined) {
      return '';
    }

    switch (column.type) {
      case 'date':
        return new Date(value as string | number | Date).toLocaleDateString();
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'number':
        return value.toString();
      default:
        return value.toString();
    }
  }

  onRowClick(row: unknown): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
    this.emitSelectionChange();
  }

  toggleRow(row: unknown): void {
    this.selection.toggle(row);
    this.emitSelectionChange();
  }

  emitSelectionChange(): void {
    this.selectionChange.emit(this.selection.selected);
  }

  getRowValue(row: unknown, columnKey: string): unknown {
    return (row as any)[columnKey];
  }

  trackByColumnKey(index: number, column: ColumnConfig): string {
    return column.key;
  }

  trackByAction(index: number, action: RowAction): string {
    return action.action;
  }

  trackByRowId(index: number, row: unknown): number | string {
    return (row as any)['id'] ?? index;
  }

  onPaginationChange(direction: 'previous' | 'next'): void {
    if (this.showInlinePagination()) {
      this.paginationChange.emit(direction);
      return;
    }
    const totalPages = this.dsClientTotalPages;
    if (direction === 'previous') {
      this.currentClientPage = Math.max(0, this.currentClientPage - 1);
    } else {
      this.currentClientPage = Math.min(totalPages - 1, this.currentClientPage + 1);
    }
  }

  onDsSort(event: DsSortEvent): void {
    const direction = event.direction === 'asc' ? 1 : -1;
    const sorted = [...this.dataSource.data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[event.column];
      const bValue = (b as Record<string, unknown>)[event.column];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return -1 * direction;
      if (bValue == null) return 1 * direction;
      return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * direction;
    });
    this.dataSource.data = sorted;
  }

  onDsSelectionChange(rows: Record<string, unknown>[]): void {
    this.selection.clear();
    this.selection.select(...(rows as unknown[]));
    this.emitSelectionChange();
  }

  private mapMaterialIconToDs(icon: string): string {
    const iconMap: Record<string, string> = {
      visibility: 'eye',
      edit: 'edit',
      delete: 'trash-2',
      more_vert: 'more-horizontal',
      picture_as_pdf: 'file-text',
      table_chart: 'table',
      print: 'printer',
    };
    return iconMap[icon] || 'more-horizontal';
  }

  getActionColor(color?: string): string {
    const colorMap: { [key: string]: string } = {
      primary: DS_CHART_FALLBACK_HEX['--ds-marine'],
      accent: DS_CHART_FALLBACK_HEX['--ds-primary'],
      warn: DS_CHART_FALLBACK_HEX['--ds-error'],
      success: DS_CHART_FALLBACK_HEX['--ds-success'],
      error: DS_CHART_FALLBACK_HEX['--ds-error'],
      warning: DS_CHART_FALLBACK_HEX['--ds-warning'],
    };
    return color ? (colorMap[color] || color) : colorMap['primary'];
  }

  hasSelection(): boolean {
    return this.selection.hasValue() && this.selection.selected.length > 0;
  }

  getSelectedCount(): number {
    return this.selection.selected.length;
  }

  exportToPDF(): void {
    const dataToExport = this.hasSelection() ? this.selection.selected : this.dataSource.data;
    this.exportRequest.emit({ format: 'pdf', data: dataToExport });
  }

  exportToExcel(): void {
    const dataToExport = this.hasSelection() ? this.selection.selected : this.dataSource.data;
    this.exportRequest.emit({ format: 'excel', data: dataToExport });
  }

  printTable(): void {
    const dataToExport = this.hasSelection() ? this.selection.selected : this.dataSource.data;
    this.exportRequest.emit({ format: 'print', data: dataToExport });
  }
}
