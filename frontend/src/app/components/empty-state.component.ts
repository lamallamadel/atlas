import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface ActionButtonConfig {
  label: string;
  handler: () => void;
}

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() message = 'Aucune donnée disponible';
  @Input() subtext = '';
  @Input() primaryAction?: ActionButtonConfig;
  @Input() secondaryAction?: ActionButtonConfig;

  onPrimaryClick(): void {
    if (this.primaryAction) {
      this.primaryAction.handler();
    }
  }

  onSecondaryClick(): void {
    if (this.secondaryAction) {
      this.secondaryAction.handler();
    }
  }
}
