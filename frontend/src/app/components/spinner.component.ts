import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, input, output } from '@angular/core';

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
  readonly variant = input<SpinnerVariant>('circular');
  readonly size = input<SpinnerSize>('md');
  readonly color = input<SpinnerColor>('primary');
  readonly message = input<string>();
  readonly timeout = input(5000); // 5 seconds default
  readonly showCancelButton = input(false);
  readonly cancelButtonLabel = input('Annuler');
  readonly timeoutMessage = input('Cette opération prend plus de temps que prévu...');
  
  /** Évite le nom d'événement DOM réservé « cancel » (no-output-native). */
  readonly cancelled = output<void>();
  readonly timeoutReached = output<void>();

  showTimeoutMessage = false;
  private timeoutTimer?: number;

  ngOnInit(): void {
    if (this.timeout() > 0) {
      this.timeoutTimer = window.setTimeout(() => {
        this.showTimeoutMessage = true;
        // TODO: The 'emit' function requires a mandatory void argument
        this.timeoutReached.emit();
      }, this.timeout());
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }

  onCancel(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.cancelled.emit();
  }

  get sizeClass(): string {
    return `spinner-${this.size()}`;
  }

  get colorClass(): string {
    return `spinner-${this.color()}`;
  }

  get variantClass(): string {
    return `spinner-${this.variant()}`;
  }
}
