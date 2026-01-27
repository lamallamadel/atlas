import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmNavigationDialogComponent } from '../components/confirm-navigation-dialog.component';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
  hasUnsavedChanges?: () => boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormUnsavedChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  
  constructor(private dialog: MatDialog) {}

  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    if (component.canDeactivate) {
      const result = component.canDeactivate();
      if (result === false || (typeof result === 'object' && result instanceof Observable)) {
        return result;
      }
    }

    if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
      const dialogRef = this.dialog.open(ConfirmNavigationDialogComponent, {
        width: '400px',
        disableClose: true
      });

      return dialogRef.afterClosed();
    }

    return true;
  }
}
