import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

@Component({
  template: `
    <div appInfiniteScroll (scrolled)="onScrolled()" style="height: 200px; overflow-y: auto;">
      <div style="height: 1000px;">Content</div>
    </div>
  `
})
class TestComponent {
  scrolledCount = 0;

  onScrolled(): void {
    this.scrolledCount++;
  }
}

describe('InfiniteScrollDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InfiniteScrollDirective, TestComponent]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divElement = fixture.debugElement.query(By.directive(InfiniteScrollDirective));
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    const directive = divElement.injector.get(InfiniteScrollDirective);
    expect(directive).toBeTruthy();
  });

  it('should emit scrolled event', (done) => {
    const directive = divElement.injector.get(InfiniteScrollDirective);
    directive.scrolled.subscribe(() => {
      expect(component.scrolledCount).toBeGreaterThan(0);
      done();
    });
  });
});
