import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { WhatsAppTemplate, ComponentType, TemplateComponent, ButtonType } from '../models/template.model';

@Component({
  selector: 'app-template-preview',
  templateUrl: './template-preview.component.html',
  styleUrls: ['./template-preview.component.css']
})
export class TemplatePreviewComponent implements OnChanges {
  @Input() template?: WhatsAppTemplate;
  
  formattedMessage = '';
  headerComponent?: TemplateComponent;
  bodyComponent?: TemplateComponent;
  footerComponent?: TemplateComponent;
  buttonsComponent?: TemplateComponent;

  ComponentType = ComponentType;
  ButtonType = ButtonType;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template'] && this.template) {
      this.parseTemplate();
      this.formatMessage();
    }
  }

  parseTemplate(): void {
    if (!this.template?.components) return;

    this.headerComponent = this.template.components.find(c => c.type === ComponentType.HEADER);
    this.bodyComponent = this.template.components.find(c => c.type === ComponentType.BODY);
    this.footerComponent = this.template.components.find(c => c.type === ComponentType.FOOTER);
    this.buttonsComponent = this.template.components.find(c => c.type === ComponentType.BUTTONS);
  }

  formatMessage(): void {
    if (!this.template) {
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
    if (!this.template?.variables) return text;

    let formatted = text;
    
    this.template.variables.forEach(variable => {
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
        return 'touch_app';
      default:
        return 'reply';
    }
  }
}
