import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { VirtualScrollListComponent } from './virtual-scroll-list.component';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

describe('VirtualScrollListComponent', () => {
  let component: VirtualScrollListComponent;
  let fixture: ComponentFixture<VirtualScrollListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VirtualScrollListComponent, LoadingSkeletonComponent],
      imports: [ScrollingModule]
    });
    fixture = TestBed.createComponent(VirtualScrollListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit scrollEnd event', () => {
    spyOn(component.scrollEnd, 'emit');
    component.onScrollEnd();
    expect(component.scrollEnd.emit).toHaveBeenCalled();
  });

  it('should track items by id', () => {
    const item = { id: 123, name: 'Test' };
    expect(component.trackByItem(0, item)).toBe(123);
  });

  it('should track items by index if no id', () => {
    const item = { name: 'Test' };
    expect(component.trackByItem(5, item)).toBe(5);
  });
});
