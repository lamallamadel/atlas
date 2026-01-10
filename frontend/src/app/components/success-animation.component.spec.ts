import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SuccessAnimationComponent } from './success-animation.component';

describe('SuccessAnimationComponent', () => {
  let component: SuccessAnimationComponent;
  let fixture: ComponentFixture<SuccessAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuccessAnimationComponent ],
      imports: [ BrowserAnimationsModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display message when provided', () => {
    component.message = 'Success!';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.success-message').textContent).toContain('Success!');
  });

  it('should not display message when not provided', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.success-message')).toBeNull();
  });

  it('should initialize animation state', () => {
    expect(component.animationState).toBe('in');
  });

  it('should have default size as medium', () => {
    expect(component.size).toBe('medium');
  });
});
