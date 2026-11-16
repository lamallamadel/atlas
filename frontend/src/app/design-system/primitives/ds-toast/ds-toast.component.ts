import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { DsIconComponent } from '../../icons/ds-icon.component';
import { DsButtonComponent } from '../ds-button/ds-button.component';

export type DsToastType = 'success' | 'error' | 'warning' | 'info';

export interface DsToastAction {
  label: string;
  handler: () => void;
}

@Component({
  selector: 'ds-toast',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsButtonComponent],
  template: `
    <div 
      class="ds-toast" 
      [class]="'ds-toast--' + type"
      [@toastAnim]="animationState"
      (mouseenter)="pauseTimer()"
      (mouseleave)="resumeTimer()"
      role="alert"
      aria-live="polite">
      
      <div class="ds-toast__icon">
        <ds-icon [name]="getIconName()" [size]="20"></ds-icon>
      </div>

      <div class="ds-toast__content">
        <div class="ds-toast__message">{{ message }}</div>
        @if (action) {
          <button class="ds-toast__action" (click)="onActionClick()">
            {{ action.label }}
          </button>
        }
      </div>

      @if (dismissible) {
        <ds-button 
          variant="icon" 
          size="sm" 
          (dsClick)="dismiss()" 
          ariaLabel="Fermer"
          class="ds-toast__close">
          <ds-icon name="close" [size]="16"></ds-icon>
        </ds-button>
      }

      @if (duration > 0) {
        <div class="ds-toast__progress">
          <div class="ds-toast__progress-bar" [style.width.%]="progress"></div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./ds-toast.component.scss'],
  animations: [
    trigger('toastAnim', [
      state('visible', style({ transform: 'translateX(0)', opacity: 1 })),
      state('hidden', style({ transform: 'translateX(100%)', opacity: 0 })),
      transition('void => visible', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)')
      ]),
      transition('visible => hidden', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class DsToastComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  @Input() message!: string;
  @Input() type: DsToastType = 'info';
  @Input() duration = 5000;
  @Input() dismissible = true;
  @Input() action?: DsToastAction;

  @Output() dismissed = new EventEmitter<string>();

  animationState = 'visible';
  progress = 100;
  private timerId?: any;
  private startTime!: number;
  private remainingTime!: number;

  ngOnInit(): void {
    if (this.duration > 0) {
      this.remainingTime = this.duration;
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.timerId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.progress = Math.max(0, 100 - (elapsed / this.remainingTime) * 100);
      
      if (elapsed >= this.remainingTime) {
        this.dismiss();
      }
    }, 50);
  }

  pauseTimer(): void {
    if (!this.timerId) return;
    this.clearTimer();
    const elapsed = Date.now() - this.startTime;
    this.remainingTime -= elapsed;
  }

  resumeTimer(): void {
    if (this.duration <= 0) return;
    this.startTimer();
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  dismiss(): void {
    this.animationState = 'hidden';
    setTimeout(() => {
      this.dismissed.emit(this.id);
    }, 200);
  }

  onActionClick(): void {
    if (this.action) {
      this.action.handler();
    }
    this.dismiss();
  }

  getIconName(): string {
    switch (this.type) {
      case 'success': return 'check';
      case 'error':   return 'info';
      case 'warning': return 'info';
      case 'info':    return 'info';
      default:        return 'info';
    }
  }
}
