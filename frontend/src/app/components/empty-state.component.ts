import { Component, ChangeDetectionStrategy, OnInit, OnChanges, input, inject } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { EmptyStateIllustrationsService, EmptyStateContext } from '../services/empty-state-illustrations.service';
import type { ActionButtonConfig, HelpLinkConfig } from './empty-state-actions.types';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent,
  DsEmptyStateComponent 
} from '../design-system';

export type { ActionButtonConfig, HelpLinkConfig } from './empty-state-actions.types';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    templateUrl: './empty-state.component.html',
    styleUrls: ['./empty-state.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DsButtonComponent, DsIconComponent, DsEmptyStateComponent]
})
export class EmptyStateComponent implements OnInit, OnChanges {
  private illustrationsService = inject(EmptyStateIllustrationsService);

  readonly message = input('');
  readonly subtext = input('');
  readonly primaryAction = input<ActionButtonConfig>();
  readonly secondaryAction = input<ActionButtonConfig>();
  readonly context = input<EmptyStateContext>();
  readonly isNewUser = input(false);
  readonly helpLink = input<HelpLinkConfig>();
  readonly customIllustration = input<SafeHtml>();
  
  displayTitle = '';
  displayMessage = '';
  displayIllustration?: SafeHtml;
  displayPrimaryAction?: ActionButtonConfig;
  displaySecondaryAction?: ActionButtonConfig;
  displayHelpLink?: HelpLinkConfig;

  ngOnInit(): void {
    this.updateDisplayProperties();
  }

  ngOnChanges(): void {
    this.updateDisplayProperties();
  }

  private updateDisplayProperties(): void {
    const context = this.context();
    if (context) {
      const config = this.illustrationsService.getConfig(context, this.isNewUser());
      this.displayTitle = config.title;
      this.displayMessage = config.message;
      this.displayIllustration = this.customIllustration() || config.illustration;
      
      this.displayPrimaryAction = config.primaryCta ? {
        label: config.primaryCta.label,
        icon: config.primaryCta.icon,
        handler: this.primaryAction()?.handler || (() => { })
      } : this.primaryAction();
      
      this.displaySecondaryAction = config.secondaryCta ? {
        label: config.secondaryCta.label,
        icon: config.secondaryCta.icon,
        handler: this.secondaryAction()?.handler || (() => { })
      } : this.secondaryAction();
      
      this.displayHelpLink = config.helpLink || this.helpLink();
    } else {
      this.displayTitle = this.message();
      this.displayMessage = this.subtext();
      this.displayPrimaryAction = this.primaryAction();
      this.displaySecondaryAction = this.secondaryAction();
      this.displayHelpLink = this.helpLink();
    }
  }

  onPrimaryClick(): void {
    this.displayPrimaryAction?.handler();
  }

  onSecondaryClick(): void {
    this.displaySecondaryAction?.handler();
  }

  onHelpLinkClick(): void {
    if (this.displayHelpLink) window.open(this.displayHelpLink.url, '_blank');
  }
}
