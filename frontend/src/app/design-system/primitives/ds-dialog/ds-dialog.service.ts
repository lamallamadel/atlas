import { Injectable, inject, TemplateRef } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';

export interface DsDialogConfig<D = any> extends DialogConfig<D> {
  variant?: 'default' | 'danger' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class DsDialogService {
  private dialog = inject(Dialog);

  open<R = any, D = any>(
    componentOrTemplate: ComponentType<any> | TemplateRef<any>,
    config?: DsDialogConfig<D>
  ): DialogRef<R, any> {
    const { variant, panelClass, ...cdkConfig } = config || {};
    
    const panelClasses = ['ds-dialog-panel', `ds-dialog-panel--${variant || 'default'}`];
    if (panelClass) {
      if (Array.isArray(panelClass)) {
        panelClasses.push(...panelClass);
      } else {
        panelClasses.push(panelClass);
      }
    }

    const finalConfig: any = {
      width: '500px',
      maxWidth: '95vw',
      backdropClass: 'ds-dialog-backdrop',
      autoFocus: 'first-tabbable',
      ...cdkConfig,
      panelClass: panelClasses
    };

    return this.dialog.open<R, D>(componentOrTemplate, finalConfig);
  }
}
