import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ActionButtonConfig, HelpLinkConfig } from './empty-state.component';
import { LottieAnimationType } from './lottie-animation.component';

@Component({
  selector: 'app-animated-empty-state',
  templateUrl: './animated-empty-state.component.html',
  styleUrls: ['./animated-empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimatedEmptyStateComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() animationType: LottieAnimationType = 'search-empty';
  @Input() animationWidth = 200;
  @Input() animationHeight = 200;
  @Input() loop = true;
  @Input() showControls = false;
  @Input() primaryAction?: ActionButtonConfig;
  @Input() secondaryAction?: ActionButtonConfig;
  @Input() helpLink?: HelpLinkConfig;

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

  onHelpLinkClick(): void {
    if (this.helpLink) {
      window.open(this.helpLink.url, '_blank');
    }
  }

  onAnimationError(error: Error): void {
    console.warn('Lottie animation failed to load, falling back to static SVG:', error);
  }
}
