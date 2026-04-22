import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

@Component({
  standalone: true,
  imports: [LazyLoadImageDirective],
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LazyLoadImageDirective, TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    imgElement = fixture.debugElement.query(By.directive(LazyLoadImageDirective));
  });

  it('should create an instance', () => {
    expect(imgElement).toBeTruthy();
    const directive = imgElement.injector.get(LazyLoadImageDirective);
    expect(directive).toBeTruthy();
  });

  it('should apply lazy-image class', () => {
    expect(imgElement.nativeElement.classList.contains('lazy-image')).toBeTruthy();
  });

  it('should set placeholder initially', () => {
    expect(imgElement.nativeElement.src).toContain('data:image/svg+xml');
  });
});
