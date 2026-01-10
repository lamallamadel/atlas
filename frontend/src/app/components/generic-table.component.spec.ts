import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { LayoutModule } from '@angular/cdk/layout';
import { GenericTableComponent, ColumnConfig, RowAction } from './generic-table.component';

describe('GenericTableComponent', () => {
  let component: GenericTableComponent;
  let fixture: ComponentFixture<GenericTableComponent>;

  const mockColumns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { key: 'name', header: 'Name', sortable: true, type: 'text' },
    { key: 'email', header: 'Email', sortable: true, type: 'text' }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenericTableComponent],
      imports: [
        BrowserAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatCardModule,
        LayoutModule
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GenericTableComponent);
    component = fixture.componentInstance;
    component.columns = mockColumns;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize dataSource with provided data', () => {
    expect(component.dataSource.data).toEqual(mockData);
  });

  it('should update displayed columns including actions', () => {
    component.showActions = true;
    component.updateDisplayedColumns();
    expect(component.displayedColumns).toEqual(['id', 'name', 'email', 'actions']);
  });

  it('should update displayed columns without actions', () => {
    component.showActions = false;
    component.updateDisplayedColumns();
    expect(component.displayedColumns).toEqual(['id', 'name', 'email']);
  });

  it('should update displayed columns with selection', () => {
    component.enableRowSelection = true;
    component.showActions = false;
    component.updateDisplayedColumns();
    expect(component.displayedColumns).toEqual(['select', 'id', 'name', 'email']);
  });

  it('should emit rowAction event when action is triggered', () => {
    spyOn(component.rowAction, 'emit');
    const testRow = mockData[0];
    component.onAction('edit', testRow);
    expect(component.rowAction.emit).toHaveBeenCalledWith({ action: 'edit', row: testRow });
  });

  it('should format date values correctly', () => {
    const date = new Date('2024-01-01');
    const column: ColumnConfig = { key: 'date', header: 'Date', type: 'date' };
    const formatted = component.formatValue(date, column, {});
    expect(formatted).toBe(date.toLocaleDateString());
  });

  it('should format boolean values correctly', () => {
    const column: ColumnConfig = { key: 'active', header: 'Active', type: 'boolean' };
    expect(component.formatValue(true, column, {})).toBe('Oui');
    expect(component.formatValue(false, column, {})).toBe('Non');
  });

  it('should handle null and undefined values', () => {
    const column: ColumnConfig = { key: 'value', header: 'Value' };
    expect(component.formatValue(null, column, {})).toBe('');
    expect(component.formatValue(undefined, column, {})).toBe('');
  });

  it('should show action based on show function', () => {
    const action: RowAction = {
      icon: 'delete',
      tooltip: 'Delete',
      action: 'delete',
      show: (row: unknown) => (row as { id: number }).id > 1
    };

    expect(component.shouldShowAction(action, { id: 1 })).toBe(false);
    expect(component.shouldShowAction(action, { id: 2 })).toBe(true);
  });

  it('should show action by default if no show function provided', () => {
    const action: RowAction = {
      icon: 'edit',
      tooltip: 'Edit',
      action: 'edit'
    };

    expect(component.shouldShowAction(action, mockData[0])).toBe(true);
  });

  it('should toggle all rows selection', () => {
    component.enableRowSelection = true;
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(mockData.length);
    
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should toggle individual row selection', () => {
    component.enableRowSelection = true;
    const row = mockData[0];
    
    component.toggleRow(row);
    expect(component.selection.isSelected(row)).toBe(true);
    
    component.toggleRow(row);
    expect(component.selection.isSelected(row)).toBe(false);
  });

  it('should detect if all rows are selected', () => {
    component.enableRowSelection = true;
    expect(component.isAllSelected()).toBe(false);
    
    component.selection.select(...mockData);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should emit selection change event', () => {
    spyOn(component.selectionChange, 'emit');
    component.enableRowSelection = true;
    
    component.toggleRow(mockData[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([mockData[0]]);
  });

  it('should handle column width settings', () => {
    const column: ColumnConfig = { 
      key: 'name', 
      header: 'Name', 
      width: '200px',
      minWidth: '100px'
    };
    
    const style = component.getColumnStyle(column);
    expect(style['width']).toBe('200px');
    expect(style['min-width']).toBe('100px');
  });

  it('should initialize column widths from config', () => {
    const columnsWithWidth: ColumnConfig[] = [
      { key: 'id', header: 'ID', width: '100px' },
      { key: 'name', header: 'Name', width: '200px' }
    ];
    
    component.columns = columnsWithWidth;
    component.initializeColumnWidths();
    
    expect(component.columnWidths.get('id')).toBe(100);
    expect(component.columnWidths.get('name')).toBe(200);
  });
});
