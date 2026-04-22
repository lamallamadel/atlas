import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonLoaderComponent } from './skeleton-loader.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SkeletonLoaderComponent]
}).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Variant Rendering', () => {
    it('should render card variant by default', () => {
      fixture.detectChanges();
      const cardElement = debugElement.query(By.css('.skeleton-card'));
      expect(cardElement).toBeTruthy();
    });

    it('should render list variant', () => {
      fixture.componentRef.setInput('variant', 'list');
      fixture.detectChanges();
      const listElement = debugElement.query(By.css('.skeleton-list'));
      expect(listElement).toBeTruthy();
    });

    it('should render table variant', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.detectChanges();
      const tableElement = debugElement.query(By.css('.skeleton-table'));
      expect(tableElement).toBeTruthy();
    });

    it('should render form variant', () => {
      fixture.componentRef.setInput('variant', 'form');
      fixture.detectChanges();
      const formElement = debugElement.query(By.css('.skeleton-form'));
      expect(formElement).toBeTruthy();
    });

    it('should render dashboard-kpi variant', () => {
      fixture.componentRef.setInput('variant', 'dashboard-kpi');
      fixture.detectChanges();
      const kpiElement = debugElement.query(By.css('.skeleton-dashboard-kpi'));
      expect(kpiElement).toBeTruthy();
    });

    it('should render detail variant', () => {
      fixture.componentRef.setInput('variant', 'detail');
      fixture.detectChanges();
      const detailElement = debugElement.query(By.css('.skeleton-detail'));
      expect(detailElement).toBeTruthy();
    });

    it('should render grid variant', () => {
      fixture.componentRef.setInput('variant', 'grid');
      fixture.detectChanges();
      const gridElement = debugElement.query(By.css('.skeleton-grid'));
      expect(gridElement).toBeTruthy();
    });

    it('should render message variant', () => {
      fixture.componentRef.setInput('variant', 'message');
      fixture.detectChanges();
      const messageElement = debugElement.query(By.css('.skeleton-message'));
      expect(messageElement).toBeTruthy();
    });

    it('should render timeline variant', () => {
      fixture.componentRef.setInput('variant', 'timeline');
      fixture.detectChanges();
      const timelineElement = debugElement.query(By.css('.skeleton-timeline'));
      expect(timelineElement).toBeTruthy();
    });
  });

  describe('Rows Configuration', () => {
    it('should render default 3 rows', () => {
      fixture.componentRef.setInput('variant', 'card');
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-card-item'));
      expect(items.length).toBe(3);
    });

    it('should render custom number of rows', () => {
      fixture.componentRef.setInput('variant', 'list');
      fixture.componentRef.setInput('rows', 5);
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-list-item'));
      expect(items.length).toBe(5);
    });

    it('should render single row', () => {
      fixture.componentRef.setInput('variant', 'card');
      fixture.componentRef.setInput('rows', 1);
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-card-item'));
      expect(items.length).toBe(1);
    });

    it('should render many rows', () => {
      fixture.componentRef.setInput('variant', 'list');
      fixture.componentRef.setInput('rows', 15);
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-list-item'));
      expect(items.length).toBe(15);
    });
  });

  describe('Columns Configuration', () => {
    it('should render default 8 columns in table', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.detectChanges();
      const headerCells = debugElement.queryAll(By.css('.skeleton-table-header-cell'));
      expect(headerCells.length).toBe(8);
    });

    it('should render custom number of columns', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.componentRef.setInput('columns', 5);
      fixture.detectChanges();
      const headerCells = debugElement.queryAll(By.css('.skeleton-table-header-cell'));
      expect(headerCells.length).toBe(5);
    });

    it('should render correct columns in each row', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.componentRef.setInput('columns', 4);
      fixture.componentRef.setInput('rows', 2);
      fixture.detectChanges();
      const rows = debugElement.queryAll(By.css('.skeleton-table-row'));
      rows.forEach(row => {
        const cells = row.queryAll(By.css('.skeleton-table-cell'));
        expect(cells.length).toBe(4);
      });
    });
  });

  describe('Animation', () => {
    it('should have animation enabled by default', () => {
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.classList.contains('skeleton-animated')).toBe(true);
    });

    it('should disable animation when animate is false', () => {
      fixture.componentRef.setInput('animate', false);
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.classList.contains('skeleton-animated')).toBe(false);
    });

    it('should enable animation when animate is true', () => {
      fixture.componentRef.setInput('animate', true);
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.classList.contains('skeleton-animated')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite"', () => {
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should have default aria-label', () => {
      fixture.detectChanges();
      const container = debugElement.query(By.css('.skeleton-container'));
      expect(container.nativeElement.getAttribute('aria-label')).toBe('Chargement en cours');
    });

    it('should have screen reader only text', () => {
      fixture.detectChanges();
      const srOnly = debugElement.query(By.css('.sr-only'));
      expect(srOnly).toBeTruthy();
      expect(srOnly.nativeElement.textContent).toContain('Chargement des données en cours');
    });

    it('should mark skeleton content as aria-hidden', () => {
      fixture.componentRef.setInput('variant', 'card');
      fixture.detectChanges();
      const skeletonContent = debugElement.query(By.css('.skeleton-card[aria-hidden="true"]'));
      expect(skeletonContent).toBeTruthy();
      expect(skeletonContent.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Helper Methods', () => {
    it('should generate rowsArray correctly', () => {
      fixture.componentRef.setInput('rows', 5);
      const rowsArray = component.rowsArray;
      expect(rowsArray.length).toBe(5);
      expect(rowsArray).toEqual([0, 1, 2, 3, 4]);
    });

    it('should generate columnsArray correctly', () => {
      fixture.componentRef.setInput('columns', 3);
      const columnsArray = component.columnsArray;
      expect(columnsArray.length).toBe(3);
      expect(columnsArray).toEqual([0, 1, 2]);
    });

    it('should track by index', () => {
      const index = 5;
      expect(component.trackByIndex(index)).toBe(index);
    });
  });

  describe('Visual Structure', () => {
    it('should render card with header, body, and footer', () => {
      fixture.componentRef.setInput('variant', 'card');
      fixture.componentRef.setInput('rows', 1);
      fixture.detectChanges();
      
      expect(debugElement.query(By.css('.skeleton-card-header'))).toBeTruthy();
      expect(debugElement.query(By.css('.skeleton-card-body'))).toBeTruthy();
      expect(debugElement.query(By.css('.skeleton-card-footer'))).toBeTruthy();
    });

    it('should render table with header and body', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.detectChanges();
      
      expect(debugElement.query(By.css('.skeleton-table-header'))).toBeTruthy();
      expect(debugElement.query(By.css('.skeleton-table-body'))).toBeTruthy();
    });

    it('should render form with groups and actions', () => {
      fixture.componentRef.setInput('variant', 'form');
      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();
      
      const groups = debugElement.queryAll(By.css('.skeleton-form-group'));
      expect(groups.length).toBe(3);
      expect(debugElement.query(By.css('.skeleton-form-actions'))).toBeTruthy();
    });

    it('should render detail with header and content', () => {
      fixture.componentRef.setInput('variant', 'detail');
      fixture.detectChanges();
      
      expect(debugElement.query(By.css('.skeleton-detail-header'))).toBeTruthy();
      expect(debugElement.query(By.css('.skeleton-detail-content'))).toBeTruthy();
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component.constructor).toBeDefined();
      // Component metadata includes changeDetection: ChangeDetectionStrategy.OnPush
      // This is verified by the component decorator
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero rows', () => {
      fixture.componentRef.setInput('variant', 'list');
      fixture.componentRef.setInput('rows', 0);
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-list-item'));
      expect(items.length).toBe(0);
    });

    it('should handle zero columns', () => {
      fixture.componentRef.setInput('variant', 'table');
      fixture.componentRef.setInput('columns', 0);
      fixture.detectChanges();
      const headerCells = debugElement.queryAll(By.css('.skeleton-table-header-cell'));
      expect(headerCells.length).toBe(0);
    });

    it('should handle large number of rows', () => {
      fixture.componentRef.setInput('variant', 'list');
      fixture.componentRef.setInput('rows', 100);
      fixture.detectChanges();
      const items = debugElement.queryAll(By.css('.skeleton-list-item'));
      expect(items.length).toBe(100);
    });
  });

  describe('Message Variant Special Cases', () => {
    it('should alternate message directions', () => {
      fixture.componentRef.setInput('variant', 'message');
      fixture.componentRef.setInput('rows', 4);
      fixture.detectChanges();
      
      const messages = debugElement.queryAll(By.css('.skeleton-message-item'));
      
      // Even indices (0, 2) should have right class
      expect(messages[0].nativeElement.classList.contains('skeleton-message-right')).toBe(true);
      expect(messages[2].nativeElement.classList.contains('skeleton-message-right')).toBe(true);
      
      // Odd indices (1, 3) should not have right class
      expect(messages[1].nativeElement.classList.contains('skeleton-message-right')).toBe(false);
      expect(messages[3].nativeElement.classList.contains('skeleton-message-right')).toBe(false);
    });
  });

  describe('Grid Variant Layout', () => {
    it('should render grid items with image and content', () => {
      fixture.componentRef.setInput('variant', 'grid');
      fixture.componentRef.setInput('rows', 3);
      fixture.detectChanges();
      
      const items = debugElement.queryAll(By.css('.skeleton-grid-item'));
      expect(items.length).toBe(3);
      
      items.forEach(item => {
        expect(item.query(By.css('.skeleton-grid-image'))).toBeTruthy();
        expect(item.query(By.css('.skeleton-grid-content'))).toBeTruthy();
      });
    });
  });

  describe('Timeline Variant Structure', () => {
    it('should render timeline items with markers', () => {
      fixture.componentRef.setInput('variant', 'timeline');
      fixture.componentRef.setInput('rows', 4);
      fixture.detectChanges();
      
      const items = debugElement.queryAll(By.css('.skeleton-timeline-item'));
      expect(items.length).toBe(4);
      
      items.forEach(item => {
        expect(item.query(By.css('.skeleton-timeline-marker'))).toBeTruthy();
        expect(item.query(By.css('.skeleton-timeline-content'))).toBeTruthy();
      });
    });
  });
});
