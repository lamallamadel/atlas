import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ActionButtonConfig, HelpLinkConfig } from './empty-state.component';
import { LottieAnimationType, LottieAnimationComponent } from './lottie-animation.component';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-animated-empty-state',
    templateUrl: './animated-empty-state.component.html',
    styleUrls: ['./animated-empty-state.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LottieAnimationComponent, MatIcon]
})
export class AnimatedEmptyStateComponent {
  readonly title = input('');
  readonly message = input('');
  readonly animationType = input<LottieAnimationType>('search-empty');
  readonly animationWidth = input(200);
  readonly animationHeight = input(200);
  readonly loop = input(true);
  readonly showControls = input(false);
  readonly primaryAction = input<ActionButtonConfig>();
  readonly secondaryAction = input<ActionButtonConfig>();
  readonly helpLink = input<HelpLinkConfig>();

  onPrimaryClick(): void {
    const primaryAction = this.primaryAction();
    if (primaryAction) {
      primaryAction.handler();
    }
  }

  onSecondaryClick(): void {
    const secondaryAction = this.secondaryAction();
    if (secondaryAction) {
      secondaryAction.handler();
    }
  }

  onHelpLinkClick(): void {
    const helpLink = this.helpLink();
    if (helpLink) {
      window.open(helpLink.url, '_blank');
    }
  }

  onAnimationError(error: Error): void {
    console.warn('Lottie animation failed to load, falling back to static SVG:', error);
  }
}
