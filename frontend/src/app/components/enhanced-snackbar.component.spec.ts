import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EnhancedSnackbarComponent } from './enhanced-snackbar.component';
import { NotificationConfig } from '../services/notification.service';

describe('EnhancedSnackbarComponent', () => {
  let component: EnhancedSnackbarComponent;
  let fixture: ComponentFixture<EnhancedSnackbarComponent>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<EnhancedSnackbarComponent>>;

  const mockData: NotificationConfig & { dismissible: boolean } = {
    message: 'Test message',
    type: 'success',
    dismissible: true
  };

  beforeEach(async () => {
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['dismiss']);

    await TestBed.configureTestingModule({
      declarations: [EnhancedSnackbarComponent],
      imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: mockData },
        { provide: MatSnackBarRef, useValue: mockSnackBarRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnhancedSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the message', () => {
    const messageElement = fixture.nativeElement.querySelector('.snackbar-message');
    expect(messageElement.textContent).toContain('Test message');
  });

  it('should display success icon for success type', () => {
    const iconElement = fixture.nativeElement.querySelector('mat-icon');
    expect(iconElement.textContent).toBe('check_circle');
  });

  it('should call dismiss when close button is clicked', () => {
    const closeButton = fixture.nativeElement.querySelector('.snackbar-close-btn');
    closeButton.click();
    expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
  });

  it('should execute action callback when action button is clicked', () => {
    const actionSpy = jasmine.createSpy('action');
    component.data = {
      ...mockData,
      action: 'Annuler',
      onAction: actionSpy
    };
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('.snackbar-action-btn');
    actionButton.click();

    expect(actionSpy).toHaveBeenCalled();
    expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
  });

  it('should not show action button when no action is provided', () => {
    component.data = {
      ...mockData,
      action: undefined,
      onAction: undefined
    };
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('.snackbar-action-btn');
    expect(actionButton).toBeNull();
  });

  it('should not show close button when dismissible is false', () => {
    component.data = {
      ...mockData,
      dismissible: false
    };
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.snackbar-close-btn');
    expect(closeButton).toBeNull();
  });

  it('should have critical class for critical priority', () => {
    component.data = {
      ...mockData,
      priority: 'critical'
    };
    fixture.detectChanges();

    const contentElement = fixture.nativeElement.querySelector('.enhanced-snackbar-content');
    expect(contentElement.classList.contains('critical')).toBe(true);
  });
});
