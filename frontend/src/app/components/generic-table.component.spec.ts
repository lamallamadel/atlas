import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LayoutModule } from '@angular/cdk/layout';
import {
  GenericTableComponent,
  ColumnConfig,
  RowAction} from './generic-table.component';

describe('GenericTableComponent', () => {
  let component: GenericTableComponent;
  let fixture: ComponentFixture<GenericTableComponent>;

  const mockColumns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { key: 'name', header: 'Name', sortable: true, type: 'text' },
    { key: 'email', header: 'Email', sortable: true, type: 'text' }];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatCheckboxModule,
        LayoutModule,
        GenericTableComponent]}).compileComponents();

    fixture = TestBed.createComponent(GenericTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize dataSource with provided data', () => {
    expect(component.dataSource.data).toEqual(mockData);
  });

  it('should emit actionTriggered event when action is triggered', () => {
    vi.spyOn(component.actionTriggered, 'emit');
    const testRow = mockData[0];
    component.onAction('edit', testRow);
    expect(component.actionTriggered.emit).toHaveBeenCalledWith({
      action: 'edit',
      row: testRow});
  });

  it('should format date values as string', () => {
    const date = new Date('2024-01-01');
    const column: ColumnConfig = { key: 'date', header: 'Date', type: 'date' };
    const formatted = component.formatValue(date, column, {});
    expect(formatted).toBeTruthy();
  });

  it('should format values as strings', () => {
    const column: ColumnConfig = { key: 'active', header: 'Active' };
    expect(component.formatValue(true, column, {})).toBe('true');
    expect(component.formatValue(false, column, {})).toBe('false');
  });

  it('should handle null and undefined values', () => {
    const column: ColumnConfig = { key: 'value', header: 'Value' };
    expect(component.formatValue(null, column, {})).toBe('—');
    expect(component.formatValue(undefined, column, {})).toBe('—');
  });

  it('should show action based on show function', () => {
    const action: RowAction<any> = {
      icon: 'delete',
      tooltip: 'Delete',
      action: 'delete',
      show: (row: unknown) =>
        (
          row as {
            id: number;
          }
        ).id > 1};

    expect(component.shouldShowAction(action, { id: 1 })).toBe(false);
    expect(component.shouldShowAction(action, { id: 2 })).toBe(true);
  });

  it('should show action by default if no show function provided', () => {
    const action: RowAction<any> = {
      icon: 'edit',
      tooltip: 'Edit',
      action: 'edit'};

    expect(component.shouldShowAction(action, mockData[0])).toBe(true);
  });

  it('should toggle all rows selection', () => {
    fixture.componentRef.setInput('enableRowSelection', true);
    component.masterToggle();
    expect(component.selection.selected.length).toBe(mockData.length);

    component.masterToggle();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should toggle individual row selection', () => {
    fixture.componentRef.setInput('enableRowSelection', true);
    const row = mockData[0];

    component.toggleRow(row);
    expect(component.selection.isSelected(row)).toBe(true);

    component.toggleRow(row);
    expect(component.selection.isSelected(row)).toBe(false);
  });

  it('should detect if all rows are selected', () => {
    fixture.componentRef.setInput('enableRowSelection', true);
    expect(component.isAllSelected()).toBe(false);

    component.selection.select(...mockData);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should emit selection change event', () => {
    vi.spyOn(component.selectionChange, 'emit');
    fixture.componentRef.setInput('enableRowSelection', true);

    component.toggleRow(mockData[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([mockData[0]]);
  });

  it('should map ds columns from input columns', () => {
    expect(component.dsColumns.length).toBe(mockColumns.length);
    expect(component.dsColumns[0].key).toBe('id');
  });

  it('should sort datasource with ds sort event', () => {
    fixture.componentRef.setInput('data', [
      { id: 2, name: 'Bravo' },
      { id: 1, name: 'Alpha' }]);
    fixture.detectChanges();

    component.onDsSort({ key: 'id', direction: 'asc' });
    expect((component.dsRows[0] as { id: number }).id).toBe(1);

    component.onDsSort({ key: 'name', direction: 'desc' });
    expect((component.dsRows[0] as { name: string }).name).toBe('Bravo');
  });

  it('should expose mapped ds row actions when actions enabled', () => {
    fixture.componentRef.setInput('showActions', true);
    fixture.componentRef.setInput('actions', [
      { icon: 'eye', tooltip: 'Voir', action: 'view' },
      { icon: 'edit', tooltip: 'Modifier', action: 'edit' }]);
    fixture.detectChanges();

    const actions = component.dsRowActions;
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].action).toBe('view');
    expect(actions[0].icon).toBe('eye');
  });

  it('should sync selection from ds-table selectionChange', () => {
    vi.spyOn(component.selectionChange, 'emit');
    fixture.componentRef.setInput('enableRowSelection', true);
    fixture.detectChanges();

    component.onDsSelectionChange([mockData[0]] as unknown as Record<string, unknown>[]);

    expect(component.selection.isSelected(mockData[0])).toBe(true);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([mockData[0]]);
  });

  it('should track pagination page number on next/previous', () => {
    fixture.componentRef.setInput('showPagination', true);
    fixture.componentRef.setInput('showInlinePagination', false);
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    expect(component.dsClientPageNumber).toBe(1);

    component.onPaginationChange('previous');
    expect(component.dsClientPageNumber).toBe(1); // already at first page

    // With only 2 items and page size 10, there's only 1 total page
    expect(component.dsClientTotalPages).toBe(1);
  });
});
