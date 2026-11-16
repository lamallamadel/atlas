import { Component, Input } from '@angular/core';

@Component({
  selector: 'ds-dialog-actions',
  standalone: true,
  template: `
    <footer [class]="classes">
      <ng-content></ng-content>
    </footer>
  `,
  styles: [`
    .ds-dialog-actions {
      display: flex;
      align-items: center;
      padding: var(--ds-space-4) var(--ds-space-6) var(--ds-space-6);
      gap: var(--ds-space-3);
      border-top: 1px solid var(--ds-divider);
      background: var(--ds-surface-2);
    }
    .ds-dialog-actions--start { justify-content: flex-start; }
    .ds-dialog-actions--center { justify-content: center; }
    .ds-dialog-actions--end { justify-content: flex-end; }
    .ds-dialog-actions--between { justify-content: space-between; }
  `]
})
export class DsDialogActionsComponent {
  @Input() align: 'start' | 'center' | 'end' | 'between' = 'end';

  get classes(): string {
    return `ds-dialog-actions ds-dialog-actions--${this.align}`;
  }
}
