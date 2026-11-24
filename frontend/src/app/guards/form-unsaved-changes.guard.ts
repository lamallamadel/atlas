import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, map } from 'rxjs';
import { DsDialogService } from '../design-system';
import { ConfirmNavigationDialogComponent } from '../components/confirm-navigation-dialog.component';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
  hasUnsavedChanges?: () => boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormUnsavedChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  private dsDialogService = inject(DsDialogService);

  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    if (component.canDeactivate) {
      const result = component.canDeactivate();
      if (result === false || (typeof result === 'object' && result instanceof Observable)) {
        return result;
      }
    }

    if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
      const dialogRef = this.dsDialogService.open<boolean>(ConfirmNavigationDialogComponent, {
        width: '400px',
        disableClose: true
      });

      return dialogRef.closed.pipe(
        map(result => result === true)
      );
    }

    return true;
  }
}
