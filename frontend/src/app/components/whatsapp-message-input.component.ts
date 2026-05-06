import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TemplateSelectionSheetComponent } from './template-selection-sheet.component';
import { MatIcon } from '@angular/material/icon';
import { MatChipListbox, MatChip, MatChipAvatar, MatChipRemove } from '@angular/material/chips';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { DsSkeletonComponent } from '../design-system/primitives/ds-skeleton/ds-skeleton.component';

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
    styleUrls: ['./whatsapp-message-input.component.css'],
    imports: [MatIcon, MatChipListbox, MatChip, MatChipAvatar, MatChipRemove, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatTooltip, MatFabButton, DsSkeletonComponent]
})
export class WhatsappMessageInputComponent {
  readonly templates = input<WhatsAppTemplate[]>([]);
  readonly disabled = input(false);
  readonly sending = input(false);
  readonly isOnline = input(true);
  readonly queuedMessagesCount = input(0);
  readonly sendMessage = output<MessageSendRequest>();

  readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  messageContent = '';
  selectedTemplate: WhatsAppTemplate | null = null;
  templateVariables: Record<string, string> = {};

  constructor(private bottomSheet: MatBottomSheet) {}

  openTemplateSelector(): void {
    const sheetRef = this.bottomSheet.open(TemplateSelectionSheetComponent, {
      data: { 
        templates: this.templates(),
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

    if (this.disabled() || this.sending()) {
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
    
    const messageInput = this.messageInput();
    if (messageInput) {
      const textarea = messageInput.nativeElement;
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
    if (this.disabled()) {
      return 'Messagerie désactivée';
    }
    if (!this.isOnline()) {
      return 'Hors ligne - Message sera mis en file d\'attente';
    }
    return 'Tapez un message...';
  }
}
