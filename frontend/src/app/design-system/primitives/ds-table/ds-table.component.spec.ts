import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DsTableComponent, DsColumn, DsRowAction } from './ds-table.component';

interface Row {
  id: number;
  name: string;
  age: number;
  status: string;
}

const COLUMNS: DsColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'right' },
  { key: 'status', header: 'Status', cell: (r) => `<strong>${r.status}</strong>` },
];

const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30, status: 'active' },
  { id: 2, name: 'Bob', age: 25, status: 'inactive' },
  { id: 3, name: 'Charlie', age: 40, status: 'active' },
];

describe('DsTableComponent', () => {
  let component: DsTableComponent<Row>;
  let fixture: ComponentFixture<DsTableComponent<Row>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DsTableComponent<Row>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.columns).toEqual([]);
    expect(component.rows).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.selectableRows).toBe(false);
  });

  describe('header rendering', () => {
    it('renders one <th> per column', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      const ths = fixture.debugElement.queryAll(By.css('thead .ds-table__th'));
      expect(ths.length).toBe(3);
    });

    it('renders column header text', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      const labels = fixture.debugElement.queryAll(By.css('.ds-table__th-label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('Name');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Age');
    });

    it('marks sortable columns with sortable class', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      const ths = fixture.debugElement.queryAll(By.css('thead .ds-table__th'));
      expect(ths[0].nativeElement.classList.contains('ds-table__th--sortable')).toBe(true);
      expect(ths[2].nativeElement.classList.contains('ds-table__th--sortable')).toBe(false);
    });

    it('shows actions header when rowActions provided', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rowActions', [
        { label: 'Edit', action: 'edit' },
      ] as DsRowAction<Row>[]);
      fixture.detectChanges();
      const actionsTh = fixture.debugElement.query(By.css('.ds-table__th--actions'));
      expect(actionsTh).toBeTruthy();
    });
  });

  describe('rows rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.detectChanges();
    });

    it('renders one row per data item', () => {
      const rows = fixture.debugElement.queryAll(By.css('tbody .ds-table__row'));
      expect(rows.length).toBe(3);
    });

    it('renders cell values', () => {
      const firstRowCells = fixture.debugElement.queryAll(By.css('tbody .ds-table__row:first-child .ds-table__td'));
      expect(firstRowCells[0].nativeElement.textContent.trim()).toBe('Alice');
      expect(firstRowCells[1].nativeElement.textContent.trim()).toBe('30');
    });

    it('uses col.cell function via safeCell when provided', () => {
      const statusCell = fixture.debugElement.queryAll(By.css('tbody .ds-table__row:first-child .ds-table__td'))[2];
      expect(statusCell.nativeElement.innerHTML).toContain('<strong>active</strong>');
    });

    it('renders em-dash for null/undefined values', () => {
      const rowsWithMissing: Row[] = [{ id: 99, name: null as any, age: 18, status: 'x' }];
      fixture.componentRef.setInput('rows', rowsWithMissing);
      fixture.detectChanges();
      const firstCell = fixture.debugElement.query(By.css('tbody .ds-table__row .ds-table__td'));
      expect(firstCell.nativeElement.textContent.trim()).toBe('—');
    });
  });

  describe('safeCell', () => {
    it('returns SafeHtml via DomSanitizer', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.detectChanges();
      const safe = component.safeCell(COLUMNS[2], ROWS[0]);
      expect(safe).toBeDefined();
      // SafeHtml is an opaque type; verify it is not the raw string
      expect(typeof safe === 'string').toBe(false);
    });
  });

  describe('empty state', () => {
    it('renders empty message when rows is empty and not loading', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', []);
      fixture.componentRef.setInput('emptyMessage', 'Aucune donnée');
      fixture.detectChanges();
      const empty = fixture.debugElement.query(By.css('.ds-table__empty'));
      expect(empty).toBeTruthy();
      expect(empty.nativeElement.textContent).toContain('Aucune donnée');
    });
  });

  describe('loading skeleton', () => {
    it('renders skeleton rows when loading', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('loadingRowCount', 3);
      fixture.detectChanges();
      const skeletonRows = fixture.debugElement.queryAll(By.css('.ds-table__row--skeleton'));
      expect(skeletonRows.length).toBe(3);
    });

    it('skeletonRows getter returns array of correct length', () => {
      fixture.componentRef.setInput('loadingRowCount', 7);
      expect(component.skeletonRows.length).toBe(7);
    });
  });

  describe('sort', () => {
    it('emits sort event with asc on first click', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      vi.spyOn(component.sort, 'emit');
      component.onSort('name');
      expect(component.sort.emit).toHaveBeenCalledWith({ column: 'name', direction: 'asc' });
      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('toggles to desc on second click of same column', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      vi.spyOn(component.sort, 'emit');
      component.onSort('name');
      component.onSort('name');
      expect(component.sort.emit).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });
      expect(component.sortDirection).toBe('desc');
    });

    it('resets to asc when switching to different column', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.detectChanges();
      component.onSort('name');
      component.onSort('name');
      vi.spyOn(component.sort, 'emit');
      component.onSort('age');
      expect(component.sort.emit).toHaveBeenCalledWith({ column: 'age', direction: 'asc' });
    });
  });

  describe('row click', () => {
    it('emits rowClick when rowClickable=true and row is clicked', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('rowClickable', true);
      fixture.detectChanges();
      vi.spyOn(component.rowClick, 'emit');
      const firstRow = fixture.debugElement.query(By.css('tbody .ds-table__row'));
      firstRow.nativeElement.click();
      expect(component.rowClick.emit).toHaveBeenCalledWith(ROWS[0]);
    });

    it('adds clickable class when rowClickable=true', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('rowClickable', true);
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css('tbody .ds-table__row'));
      expect(row.nativeElement.classList.contains('ds-table__row--clickable')).toBe(true);
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('selectableRows', true);
      fixture.detectChanges();
    });

    it('renders header + body checkboxes when selectableRows=true', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('.ds-table__checkbox'));
      expect(checkboxes.length).toBe(4); // 1 header + 3 rows
    });

    it('isRowSelected returns true for selected rows', () => {
      fixture.componentRef.setInput('selectedRows', [ROWS[0]]);
      fixture.detectChanges();
      expect(component.isRowSelected(ROWS[0])).toBe(true);
      expect(component.isRowSelected(ROWS[1])).toBe(false);
    });

    it('isAllRowsSelected true when selectedRows length matches rows length', () => {
      fixture.componentRef.setInput('selectedRows', [...ROWS]);
      fixture.detectChanges();
      expect(component.isAllRowsSelected()).toBe(true);
    });

    it('isAllRowsSelected false when partial selection', () => {
      fixture.componentRef.setInput('selectedRows', [ROWS[0]]);
      fixture.detectChanges();
      expect(component.isAllRowsSelected()).toBe(false);
    });

    it('toggleRowSelection adds row when not selected', () => {
      vi.spyOn(component.selectionChange, 'emit');
      const evt = new Event('change');
      vi.spyOn(evt, 'stopPropagation');
      component.toggleRowSelection(ROWS[1], evt);
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(component.selectionChange.emit).toHaveBeenCalledWith([ROWS[1]]);
    });

    it('toggleRowSelection removes row when already selected', () => {
      fixture.componentRef.setInput('selectedRows', [ROWS[0], ROWS[1]]);
      fixture.detectChanges();
      vi.spyOn(component.selectionChange, 'emit');
      component.toggleRowSelection(ROWS[0], new Event('change'));
      expect(component.selectionChange.emit).toHaveBeenCalledWith([ROWS[1]]);
    });

    it('toggleAllRows selects all when none selected', () => {
      vi.spyOn(component.selectionChange, 'emit');
      component.toggleAllRows(new Event('change'));
      expect(component.selectionChange.emit).toHaveBeenCalledWith([...ROWS]);
    });

    it('toggleAllRows clears selection when all selected', () => {
      fixture.componentRef.setInput('selectedRows', [...ROWS]);
      fixture.detectChanges();
      vi.spyOn(component.selectionChange, 'emit');
      component.toggleAllRows(new Event('change'));
      expect(component.selectionChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('row actions', () => {
    const ACTIONS: DsRowAction<Row>[] = [
      { label: 'Edit', action: 'edit', icon: 'edit' },
      { label: 'Delete', action: 'delete', icon: 'trash', show: (r) => r.status === 'active' },
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('rowActions', ACTIONS);
      fixture.detectChanges();
    });

    it('getVisibleActions filters via show predicate', () => {
      // Alice is active → both actions visible
      expect(component.getVisibleActions(ROWS[0]).length).toBe(2);
      // Bob is inactive → only Edit (no show) visible
      expect(component.getVisibleActions(ROWS[1]).length).toBe(1);
      expect(component.getVisibleActions(ROWS[1])[0].action).toBe('edit');
    });

    it('emits rowAction with action and row on action click', () => {
      vi.spyOn(component.rowAction, 'emit');
      const evt = new Event('click');
      vi.spyOn(evt, 'stopPropagation');
      component.onRowAction(ROWS[0], 'edit', evt);
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(component.rowAction.emit).toHaveBeenCalledWith({ action: 'edit', row: ROWS[0] });
    });
  });

  describe('pagination', () => {
    it('renders pagination when showPagination=true and data provided', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('showPagination', true);
      fixture.componentRef.setInput('paginationData', {
        number: 0, size: 10, totalElements: 30, first: true, last: false,
      });
      fixture.detectChanges();
      const pag = fixture.debugElement.query(By.css('.ds-table__pagination'));
      expect(pag).toBeTruthy();
    });

    it('does not render pagination when showPagination=false', () => {
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.detectChanges();
      const pag = fixture.debugElement.query(By.css('.ds-table__pagination'));
      expect(pag).toBeFalsy();
    });
  });

  describe('trackBy', () => {
    it('defaults to index when trackBy not provided', () => {
      expect(component.trackByFn(5, ROWS[0])).toBe(5);
    });

    it('uses provided trackBy function', () => {
      fixture.componentRef.setInput('trackBy', (_: number, r: Row) => r.id);
      expect(component.trackByFn(0, ROWS[0])).toBe(1);
      expect(component.trackByFn(0, ROWS[2])).toBe(3);
    });
  });

  describe('getCellValue', () => {
    it('returns value when present', () => {
      expect(component.getCellValue(ROWS[0], 'name')).toBe('Alice');
    });

    it('returns em-dash for missing key', () => {
      expect(component.getCellValue(ROWS[0], 'missing')).toBe('—');
    });
  });
});
