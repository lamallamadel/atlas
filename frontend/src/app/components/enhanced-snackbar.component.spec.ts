import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EnhancedSnackbarComponent } from './enhanced-snackbar.component';

describe('EnhancedSnackbarComponent', () => {
  let component: EnhancedSnackbarComponent;
  let fixture: ComponentFixture<EnhancedSnackbarComponent>;
  let snackBarRef: jasmine.SpyObj<MatSnackBarRef<EnhancedSnackbarComponent>>;

  beforeEach(async () => {
    const snackBarRefSpy = jasmine.createSpyObj('MatSnackBarRef', ['dismiss']);

    await TestBed.configureTestingModule({
      declarations: [ EnhancedSnackbarComponent ],
      imports: [
        MatIconModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatSnackBarRef, useValue: snackBarRefSpy },
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: {
            message: 'Test message',
            type: 'success',
            dismissible: true
          }
        }
      ]
    })
    .compileComponents();

    snackBarRef = TestBed.inject(MatSnackBarRef) as jasmine.SpyObj<MatSnackBarRef<EnhancedSnackbarComponent>>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnhancedSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the message', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.snackbar-message').textContent).toContain('Test message');
  });

  it('should call dismiss when close button is clicked', () => {
    component.dismiss();
    expect(snackBarRef.dismiss).toHaveBeenCalled();
  });

  it('should execute action callback when action button is clicked', () => {
    const mockAction = jasmine.createSpy('onAction');
    component.data.onAction = mockAction;
    component.data.action = 'Retry';
    fixture.detectChanges();

    component.onAction();

    expect(mockAction).toHaveBeenCalled();
    expect(snackBarRef.dismiss).toHaveBeenCalled();
  });
});
