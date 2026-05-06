import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, input, output, viewChild } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { listStaggerAnimation } from '../animations/list-animations';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgStyle } from '@angular/common';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { DsCardComponent } from '../design-system';
import { DS_CHART_FALLBACK_HEX } from '../design-system/chart-ds-colors';

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
    imports: [MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, NgStyle, MatMenuTrigger, MatMenu, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, DsCardComponent, MatPaginator]
})
export class GenericTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
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

  readonly paginator = viewChild(MatPaginator);
  readonly sort = viewChild(MatSort);

  dataSource = new MatTableDataSource<unknown>([]);
  displayedColumns: string[] = [];
  selection = new SelectionModel<unknown>(true, []);
  isMobile = false;
  columnWidths: Map<string, number> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.dataSource.data = this.data();
    this.updateDisplayedColumns();
    this.initializeColumnWidths();
    this.observeBreakpoints();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data();
      this.selection.clear();
    }
    if (changes['columns']) {
      this.updateDisplayedColumns();
      this.initializeColumnWidths();
    }
  }

  ngAfterViewInit(): void {
    const paginator = this.paginator();
    if (this.showPagination() && paginator) {
      this.dataSource.paginator = paginator;
    }
    const sort = this.sort();
    if (this.enableSort() && sort) {
      this.dataSource.sort = sort;
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

  initializeColumnWidths(): void {
    this.columns().forEach(col => {
      if (col.width) {
        const widthValue = parseInt(col.width);
        this.columnWidths.set(col.key, widthValue);
      }
    });
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = [];
    
    if (this.enableRowSelection()) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.columns().map(col => col.key));
    
    if (this.showActions()) {
      this.displayedColumns.push('actions');
    }
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

  onResizeStart(event: MouseEvent, columnKey: string): void {
    event.preventDefault();
    const startX = event.pageX;
    const startWidth = this.columnWidths.get(columnKey) || 150;

    const onMouseMove = (e: MouseEvent) => {
      const diff = e.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      this.columnWidths.set(columnKey, newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  getColumnWidth(columnKey: string): string {
    const width = this.columnWidths.get(columnKey);
    return width ? `${width}px` : 'auto';
  }

  getColumnStyle(column: ColumnConfig): { [key: string]: string } {
    const style: { [key: string]: string } = {};
    
    if (column.width) {
      style['width'] = column.width;
    } else if (this.columnWidths.has(column.key)) {
      style['width'] = this.getColumnWidth(column.key);
    }
    
    if (column.minWidth) {
      style['min-width'] = column.minWidth;
    }
    
    return style;
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

  trackByIndex(index: number): number {
    return index;
  }

  onPaginationChange(direction: 'previous' | 'next'): void {
    this.paginationChange.emit(direction);
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
