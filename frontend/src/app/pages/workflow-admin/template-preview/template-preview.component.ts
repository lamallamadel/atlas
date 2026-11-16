import { Component, OnChanges, SimpleChanges, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppTemplate, ComponentType, TemplateComponent, ButtonType } from '../models/template.model';
import { DsBadgeComponent, DsButtonComponent, DsCardComponent, DsIconComponent } from '../../../design-system';
import { LineBreakPipe } from '../pipes/line-break.pipe';

@Component({
    selector: 'app-template-preview',
    standalone: true,
    templateUrl: './template-preview.component.html',
    styleUrls: ['./template-preview.component.css'],
    imports: [CommonModule, DsCardComponent, DsIconComponent, DsButtonComponent, DsBadgeComponent, LineBreakPipe]
})
export class TemplatePreviewComponent implements OnChanges {
  readonly template = input<WhatsAppTemplate>();
  readonly formData = input<any>();
  
  formattedMessage = '';
  headerComponent?: TemplateComponent;
  bodyComponent?: TemplateComponent;
  footerComponent?: TemplateComponent;
  buttonsComponent?: TemplateComponent;

  ComponentType = ComponentType;
  ButtonType = ButtonType;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template'] && this.template()) {
      this.parseTemplate();
      this.formatMessage();
    }
  }

  parseTemplate(): void {
    const template = this.template();
    if (!template?.components) return;

    this.headerComponent = template.components.find(c => c.type === ComponentType.HEADER);
    this.bodyComponent = template.components.find(c => c.type === ComponentType.BODY);
    this.footerComponent = template.components.find(c => c.type === ComponentType.FOOTER);
    this.buttonsComponent = template.components.find(c => c.type === ComponentType.BUTTONS);
  }

  formatMessage(): void {
    if (!this.template()) {
      this.formattedMessage = '';
      return;
    }

    let message = '';

    if (this.headerComponent?.text) {
      message += this.formatTextWithVariables(this.headerComponent.text) + '\n\n';
    }

    if (this.bodyComponent?.text) {
      message += this.formatTextWithVariables(this.bodyComponent.text);
    }

    if (this.footerComponent?.text) {
      message += '\n\n' + this.formatTextWithVariables(this.footerComponent.text);
    }

    this.formattedMessage = message;
  }

  formatTextWithVariables(text: string): string {
    const template = this.template();
    if (!template?.variables) return text;

    let formatted = text;
    
    template.variables.forEach(variable => {
      const placeholder = new RegExp(`\\{\\{${variable.variableName}\\}\\}`, 'g');
      const replacement = variable.exampleValue || `[${variable.variableName}]`;
      formatted = formatted.replace(placeholder, replacement);
    });

    return formatted;
  }

  getButtonIcon(buttonType: ButtonType): string {
    switch (buttonType) {
      case ButtonType.URL:
        return 'link';
      case ButtonType.PHONE_NUMBER:
        return 'phone';
      case ButtonType.CALL_TO_ACTION:
        return 'chevron-right';
      default:
        return 'info';
    }
  }
}
