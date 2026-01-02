import { Component, Input, Output, EventEmitter, ViewChild, OnInit, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface ColumnConfig {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  format?: (value: unknown, row: unknown) => string;
}

export interface RowAction {
  icon: string;
  tooltip: string;
  action: 'view' | 'edit' | 'delete' | string;
  color?: string;
  show?: (row: unknown) => boolean;
}

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.css']
})
export class GenericTableComponent implements OnInit, AfterViewInit, OnChanges {
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

  @Output() rowAction = new EventEmitter<{ action: string; row: unknown }>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<unknown>([]);
  displayedColumns: string[] = [];

  ngOnInit(): void {
    this.dataSource.data = this.data;
    this.updateDisplayedColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
    if (changes['columns']) {
      this.updateDisplayedColumns();
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

  updateDisplayedColumns(): void {
    this.displayedColumns = this.columns.map(col => col.key);
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
}
