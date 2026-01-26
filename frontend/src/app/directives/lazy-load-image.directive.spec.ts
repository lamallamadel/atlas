import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

@Component({
  template: `
    <img [appLazyLoadImage]="imageUrl" [placeholder]="placeholderUrl" alt="Test image" />
  `
})
class TestComponent {
  imageUrl = 'https://example.com/image.jpg';
  placeholderUrl = 'data:image/svg+xml;base64,placeholder';
}

describe('LazyLoadImageDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LazyLoadImageDirective, TestComponent]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    imgElement = fixture.debugElement.query(By.directive(LazyLoadImageDirective));
  });

  it('should create an instance', () => {
    const directive = imgElement.injector.get(LazyLoadImageDirective);
    expect(directive).toBeTruthy();
  });

  it('should apply lazy-image class', () => {
    fixture.detectChanges();
    expect(imgElement.nativeElement.classList.contains('lazy-image')).toBeTruthy();
  });

  it('should set placeholder initially', () => {
    fixture.detectChanges();
    expect(imgElement.nativeElement.src).toContain('placeholder');
  });
});
