import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SkeletonLoaderComponent } from './skeleton-loader.component';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

describe('SkeletonLoaderComponent', () => {
  let fixture: ComponentFixture<SkeletonLoaderComponent>;
  let debugElement: DebugElement;

  function childLoadingSkeleton(): LoadingSkeletonComponent {
    const el = debugElement.query(By.directive(LoadingSkeletonComponent));
    expect(el).toBeTruthy();
    return el.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render app-loading-skeleton', () => {
    fixture.detectChanges();
    expect(debugElement.query(By.css('app-loading-skeleton'))).toBeTruthy();
  });

  it('should forward variant, rows, columns and animate', () => {
    fixture.componentRef.setInput('variant', 'table');
    fixture.componentRef.setInput('rows', 7);
    fixture.componentRef.setInput('columns', 4);
    fixture.componentRef.setInput('animate', false);
    fixture.detectChanges();

    const inner = childLoadingSkeleton();
    expect(inner.variant()).toBe('table');
    expect(inner.rows()).toBe(7);
    expect(inner.columns()).toBe(4);
    expect(inner.animate()).toBe(false);
  });

  it('should use defaults on inner loader', () => {
    fixture.detectChanges();
    const inner = childLoadingSkeleton();
    expect(inner.variant()).toBe('card');
    expect(inner.rows()).toBe(3);
    expect(inner.columns()).toBe(8);
    expect(inner.animate()).toBe(true);
  });

  it('should expose same accessibility shell via inner component', () => {
    fixture.detectChanges();
    const container = debugElement.query(By.css('.skeleton-container'));
    expect(container).toBeTruthy();
    expect(container.nativeElement.getAttribute('role')).toBe('status');
  });
});
