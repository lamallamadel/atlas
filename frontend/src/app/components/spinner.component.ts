import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

export type SpinnerVariant = 'circular' | 'linear' | 'dots';
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'neutral';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent implements OnInit, OnDestroy {
  @Input() variant: SpinnerVariant = 'circular';
  @Input() size: SpinnerSize = 'md';
  @Input() color: SpinnerColor = 'primary';
  @Input() message?: string;
  @Input() timeout = 5000; // 5 seconds default
  @Input() showCancelButton = false;
  @Input() cancelButtonLabel = 'Annuler';
  @Input() timeoutMessage = 'Cette opération prend plus de temps que prévu...';
  
  @Output() cancel = new EventEmitter<void>();
  @Output() timeoutReached = new EventEmitter<void>();

  showTimeoutMessage = false;
  private timeoutTimer?: number;

  ngOnInit(): void {
    if (this.timeout > 0) {
      this.timeoutTimer = window.setTimeout(() => {
        this.showTimeoutMessage = true;
        this.timeoutReached.emit();
      }, this.timeout);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get sizeClass(): string {
    return `spinner-${this.size}`;
  }

  get colorClass(): string {
    return `spinner-${this.color}`;
  }

  get variantClass(): string {
    return `spinner-${this.variant}`;
  }
}
