import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  FormUnsavedChangesGuard,
  ComponentCanDeactivate,
} from './form-unsaved-changes.guard';

describe('FormUnsavedChangesGuard', () => {
  let guard: FormUnsavedChangesGuard;
  let dialogSpy: AngularVitestPartialMock<MatDialog>;

  beforeEach(() => {
    const spy = {
      open: vi.fn().mockName('MatDialog.open'),
    };

    TestBed.configureTestingModule({
      providers: [
        FormUnsavedChangesGuard,
        { provide: MatDialog, useValue: spy },
      ],
    });

    guard = TestBed.inject(FormUnsavedChangesGuard);
    dialogSpy = TestBed.inject(MatDialog) as AngularVitestPartialMock<MatDialog>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow deactivation when no unsaved changes', () => {
    const component: ComponentCanDeactivate = {
      canDeactivate: () => true,
      hasUnsavedChanges: () => false,
    };

    const result = guard.canDeactivate(component);
    expect(result).toBe(true);
  });

  it('should show dialog when has unsaved changes', async () => {
    const component: ComponentCanDeactivate = {
      canDeactivate: () => true,
      hasUnsavedChanges: () => true,
    };

    dialogSpy.open.mockReturnValue({
      afterClosed: () => of(true),
    } as any);

    const result = guard.canDeactivate(component);
    if (result instanceof Object) {
      (result as any).subscribe((canDeactivate: boolean) => {
        expect(canDeactivate).toBe(true);
        expect(dialogSpy.open).toHaveBeenCalled();
      });
    }
  });

  it('should prevent deactivation when canDeactivate returns false', () => {
    const component: ComponentCanDeactivate = {
      canDeactivate: () => false,
    };

    const result = guard.canDeactivate(component);
    expect(result).toBe(false);
  });
});
