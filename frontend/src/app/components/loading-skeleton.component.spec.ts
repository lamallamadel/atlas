import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

describe('LoadingSkeletonComponent', () => {
  let component: LoadingSkeletonComponent;
  let fixture: ComponentFixture<LoadingSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingSkeletonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to card variant', () => {
    expect(component.variant).toBe('card');
  });

  it('should default to 3 rows', () => {
    expect(component.rows).toBe(3);
  });

  it('should default to 8 columns', () => {
    expect(component.columns).toBe(8);
  });

  it('should generate correct number of rows', () => {
    component.rows = 5;
    expect(component.rowsArray.length).toBe(5);
  });

  it('should generate correct number of columns', () => {
    component.columns = 10;
    expect(component.columnsArray.length).toBe(10);
  });

  it('should accept different variants', () => {
    component.variant = 'table';
    fixture.detectChanges();
    expect(component.variant).toBe('table');
  });
});
