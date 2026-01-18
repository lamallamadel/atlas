import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TemplateSelectionSheetComponent } from './template-selection-sheet.component';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  description: string;
}

export interface MessageSendRequest {
  content: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

@Component({
  selector: 'app-whatsapp-message-input',
  templateUrl: './whatsapp-message-input.component.html',
  styleUrls: ['./whatsapp-message-input.component.css']
})
export class WhatsappMessageInputComponent {
  @Input() templates: WhatsAppTemplate[] = [];
  @Input() disabled = false;
  @Input() sending = false;
  @Input() isOnline = true;
  @Input() queuedMessagesCount = 0;
  @Output() sendMessage = new EventEmitter<MessageSendRequest>();

  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;

  messageContent = '';
  selectedTemplate: WhatsAppTemplate | null = null;
  templateVariables: Record<string, string> = {};

  constructor(private bottomSheet: MatBottomSheet) {}

  openTemplateSelector(): void {
    const sheetRef = this.bottomSheet.open(TemplateSelectionSheetComponent, {
      data: { 
        templates: this.templates,
        currentTemplate: this.selectedTemplate
      },
      panelClass: 'template-bottom-sheet',
      backdropClass: 'template-bottom-sheet-backdrop'
    });

    sheetRef.afterDismissed().subscribe((result: { template: WhatsAppTemplate | null }) => {
      if (result) {
        this.onTemplateSelected(result.template);
      }
    });
  }

  onTemplateSelected(template: WhatsAppTemplate | null): void {
    this.selectedTemplate = template;
    
    if (template) {
      this.templateVariables = {};
      template.variables.forEach(variable => {
        this.templateVariables[variable] = '';
      });
      this.updateMessagePreview();
    } else {
      this.messageContent = '';
      this.templateVariables = {};
    }
  }

  onVariableChange(): void {
    this.updateMessagePreview();
  }

  updateMessagePreview(): void {
    if (!this.selectedTemplate) {
      return;
    }

    let preview = this.selectedTemplate.content;
    this.selectedTemplate.variables.forEach(variable => {
      const value = this.templateVariables[variable] || `{{${variable}}}`;
      preview = preview.replace(`{{${variable}}}`, value);
    });
    this.messageContent = preview;
  }

  autoGrow(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSend(): void {
    if (!this.canSend()) {
      return;
    }

    const request: MessageSendRequest = {
      content: this.messageContent.trim(),
      templateId: this.selectedTemplate?.id,
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined
    };

    this.sendMessage.emit(request);
    this.reset();
  }

  canSend(): boolean {
    if (!this.messageContent || this.messageContent.trim() === '') {
      return false;
    }

    if (this.disabled || this.sending) {
      return false;
    }

    if (this.selectedTemplate) {
      const hasEmptyVariables = this.selectedTemplate.variables.some(
        variable => !this.templateVariables[variable] || this.templateVariables[variable].trim() === ''
      );
      if (hasEmptyVariables) {
        return false;
      }
    }

    return true;
  }

  reset(): void {
    this.messageContent = '';
    this.selectedTemplate = null;
    this.templateVariables = {};
    
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.focus();
    }
  }

  removeTemplate(): void {
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.messageContent = '';
  }

  getPlaceholder(): string {
    if (this.disabled) {
      return 'Messagerie désactivée';
    }
    if (!this.isOnline) {
      return 'Hors ligne - Message sera mis en file d\'attente';
    }
    return 'Tapez un message...';
  }
}
