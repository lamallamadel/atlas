import { Component, ElementRef, input, output, viewChild, inject } from '@angular/core';
import { TemplateSelectionSheetComponent } from './template-selection-sheet.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent,
  DsSkeletonComponent,
  DsFilterChipComponent,
  DsCardComponent,
  DsBadgeComponent,
  DsDialogService
} from '../design-system';

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
    standalone: true,
    templateUrl: './whatsapp-message-input.component.html',
    styleUrls: ['./whatsapp-message-input.component.css'],
    imports: [
      CommonModule, 
      FormsModule,
      DsButtonComponent,
      DsIconComponent,
      DsInputComponent,
      DsSkeletonComponent,
      DsFilterChipComponent,
      DsCardComponent
    ]
})
export class WhatsappMessageInputComponent {
  private dsDialogService = inject(DsDialogService);

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

  openTemplateSelector(): void {
    const dialogRef = this.dsDialogService.open<any>(TemplateSelectionSheetComponent, {
      panelClass: 'ds-dialog-panel--bottom-sheet',
      data: { 
        templates: this.templates(),
        currentTemplate: this.selectedTemplate
      }
    });

    dialogRef.closed.subscribe((result: { template: WhatsAppTemplate | null } | undefined) => {
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
