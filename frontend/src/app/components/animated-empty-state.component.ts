import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ActionButtonConfig, HelpLinkConfig } from './empty-state-actions.types';
import { LottieAnimationType, LottieAnimationComponent } from './lottie-animation.component';
import { DsButtonComponent, DsIconComponent } from '../design-system';

@Component({
    selector: 'app-animated-empty-state',
    standalone: true,
    templateUrl: './animated-empty-state.component.html',
    styleUrls: ['./animated-empty-state.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, LottieAnimationComponent, DsButtonComponent, DsIconComponent]
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
    this.primaryAction()?.handler();
  }

  onSecondaryClick(): void {
    this.secondaryAction()?.handler();
  }

  onHelpLinkClick(): void {
    const helpLink = this.helpLink();
    if (helpLink) window.open(helpLink.url, '_blank');
  }

  onAnimationError(error: Error): void {
    console.warn('Lottie animation failed:', error);
  }
}
