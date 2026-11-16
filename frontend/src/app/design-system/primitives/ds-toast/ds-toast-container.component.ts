import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsToastService, DsToast } from './ds-toast.service';
import { DsToastComponent } from './ds-toast.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'ds-toast-container',
  standalone: true,
  imports: [CommonModule, DsToastComponent],
  template: `
    <div class="ds-toast-container">
      @for (toast of toasts$ | async; track toast.id) {
        <ds-toast
          [id]="toast.id"
          [message]="toast.message"
          [type]="toast.type"
          [duration]="toast.duration ?? 5000"
          [dismissible]="toast.dismissible ?? true"
          [action]="toast.action"
          (dismissed)="onDismiss($event)">
        </ds-toast>
      }
    </div>
  `,
  styles: [`
    .ds-toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 100vw;
    }

    @media (max-width: 600px) {
      .ds-toast-container {
        top: 12px;
        right: 12px;
        left: 12px;
      }
    }
  `]
})
export class DsToastContainerComponent implements OnInit {
  private toastService = inject(DsToastService);
  toasts$!: Observable<DsToast[]>;

  ngOnInit(): void {
    this.toasts$ = this.toastService.activeToasts;
  }

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
