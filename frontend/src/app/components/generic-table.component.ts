import { Component, Input, Output, EventEmitter, ViewChild, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { listStaggerAnimation } from '../animations/list-animations';

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
  animations: [listStaggerAnimation]
})
export class GenericTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() columns: ColumnConfig[] = [];
  @Input() data: unknown[] = [];
  @Input() showActions = true;
  @Input() actions: RowAction[] = [
    { icon: 'visibility', tooltip: 'Voir', action: 'view', color: 'primary' },
    { icon: 'edit', tooltip: 'Modifier', action: 'edit', color: 'accent' },
    { icon: 'delete', tooltip: 'Supprimer', action: 'delete', color: 'warn' }
  ];
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  @Input() showPagination = true;
  @Input() enableSort = true;
  @Input() rowClickable = false;
  @Input() enableRowSelection = false;
  @Input() stickyHeader = true;
  @Input() enableVirtualScroll = false;
  @Input() virtualScrollItemSize = 48;
  @Input() useKebabMenu = false;
  @Input() showTableHeader = false;
  @Input() showInlinePagination = false;
  @Input() paginationData?: PaginationData;
  @Input() counterSingular = 'élément';
  @Input() counterPlural = 'éléments';
  @Input() enableExport = false;
  @Input() exportConfig?: {
    title?: string;
    filename?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  @Output() rowAction = new EventEmitter<{ action: string; row: unknown }>();
  @Output() rowClick = new EventEmitter<unknown>();
  @Output() selectionChange = new EventEmitter<unknown[]>();
  @Output() paginationChange = new EventEmitter<'previous' | 'next'>();
  @Output() exportRequest = new EventEmitter<{ format: 'pdf' | 'excel' | 'print'; data: unknown[] }>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<unknown>([]);
  displayedColumns: string[] = [];
  selection = new SelectionModel<unknown>(true, []);
  isMobile = false;
  columnWidths: Map<string, number> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.dataSource.data = this.data;
    this.updateDisplayedColumns();
    this.initializeColumnWidths();
    this.observeBreakpoints();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data;
      this.selection.clear();
    }
    if (changes['columns']) {
      this.updateDisplayedColumns();
      this.initializeColumnWidths();
    }
  }

  ngAfterViewInit(): void {
    if (this.showPagination) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.enableSort) {
      this.dataSource.sort = this.sort;
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
    this.columns.forEach(col => {
      if (col.width) {
        const widthValue = parseInt(col.width);
        this.columnWidths.set(col.key, widthValue);
      }
    });
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = [];
    
    if (this.enableRowSelection) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.columns.map(col => col.key));
    
    if (this.showActions) {
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
    if (this.rowClickable) {
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
      'primary': '#2c5aa0',
      'accent': '#e67e22',
      'warn': '#e74c3c',
      'success': '#4caf50',
      'error': '#e74c3c',
      'warning': '#ff9800'
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
