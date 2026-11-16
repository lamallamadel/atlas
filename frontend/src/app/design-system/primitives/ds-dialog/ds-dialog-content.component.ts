import { Component } from '@angular/core';

@Component({
  selector: 'ds-dialog-content',
  standalone: true,
  template: `
    <div class="ds-dialog-content">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .ds-dialog-content {
      padding: var(--ds-space-6);
      overflow-y: auto;
      flex: 1;
      font-size: var(--ds-text-base);
      color: var(--ds-text);
      line-height: 1.6;
    }
    
    /* Custom scrollbar for premium look */
    .ds-dialog-content::-webkit-scrollbar {
      width: 6px;
    }
    .ds-dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .ds-dialog-content::-webkit-scrollbar-thumb {
      background: var(--ds-surface-dynamic);
      border-radius: var(--ds-radius-pill);
    }
  `]
})
export class DsDialogContentComponent {}
