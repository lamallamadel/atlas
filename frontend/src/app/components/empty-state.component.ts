import { Component, Input, ChangeDetectionStrategy, OnInit, OnChanges } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { EmptyStateIllustrationsService, EmptyStateContext } from '../services/empty-state-illustrations.service';

export interface ActionButtonConfig {
  label: string;
  icon?: string;
  handler: () => void;
}

export interface HelpLinkConfig {
  label: string;
  url: string;
}

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent implements OnInit, OnChanges {
  // Legacy inputs (for backwards compatibility)
  @Input() message = '';
  @Input() subtext = '';
  @Input() primaryAction?: ActionButtonConfig;
  @Input() secondaryAction?: ActionButtonConfig;
  
  // New context-based inputs
  @Input() context?: EmptyStateContext;
  @Input() isNewUser = false;
  
  // New inputs for enhanced functionality
  @Input() helpLink?: HelpLinkConfig;
  @Input() customIllustration?: SafeHtml;
  
  // Computed properties
  displayTitle = '';
  displayMessage = '';
  displayIllustration?: SafeHtml;
  displayPrimaryAction?: ActionButtonConfig;
  displaySecondaryAction?: ActionButtonConfig;
  displayHelpLink?: HelpLinkConfig;

  constructor(private illustrationsService: EmptyStateIllustrationsService) {}

  ngOnInit(): void {
    this.updateDisplayProperties();
  }

  ngOnChanges(): void {
    this.updateDisplayProperties();
  }

  private updateDisplayProperties(): void {
    // If context is provided, use the service to get configuration
    if (this.context) {
      const config = this.illustrationsService.getConfig(this.context, this.isNewUser);
      this.displayTitle = config.title;
      this.displayMessage = config.message;
      this.displayIllustration = this.customIllustration || config.illustration;
      
      // Map service config to component format
      this.displayPrimaryAction = config.primaryCta ? {
        label: config.primaryCta.label,
        icon: config.primaryCta.icon,
        handler: this.primaryAction?.handler || (() => { /* no-op */ })
      } : this.primaryAction;
      
      this.displaySecondaryAction = config.secondaryCta ? {
        label: config.secondaryCta.label,
        icon: config.secondaryCta.icon,
        handler: this.secondaryAction?.handler || (() => { /* no-op */ })
      } : this.secondaryAction;
      
      this.displayHelpLink = config.helpLink || this.helpLink;
    } else {
      // Fall back to legacy mode
      this.displayTitle = this.message;
      this.displayMessage = this.subtext;
      this.displayPrimaryAction = this.primaryAction;
      this.displaySecondaryAction = this.secondaryAction;
      this.displayHelpLink = this.helpLink;
    }
  }

  onPrimaryClick(): void {
    if (this.displayPrimaryAction) {
      this.displayPrimaryAction.handler();
    }
  }

  onSecondaryClick(): void {
    if (this.displaySecondaryAction) {
      this.displaySecondaryAction.handler();
    }
  }

  onHelpLinkClick(): void {
    if (this.displayHelpLink) {
      window.open(this.displayHelpLink.url, '_blank');
    }
  }
}
