import { Component, OnInit, input, output } from '@angular/core';
import { OutboundMessageApiService, OutboundMessageTemplate, OutboundMessageCreateRequest } from '../../services/outbound-message-api.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-outbound-message-form',
    templateUrl: './outbound-message-form.component.html',
    styleUrls: ['./outbound-message-form.component.css'],
    imports: [FormsModule]
})
export class OutboundMessageFormComponent implements OnInit {
  readonly dossierId = input.required<number>();
  readonly recipientPhone = input<string>();
  readonly leadName = input<string>();
  readonly messageSent = output<void>();

  templates: OutboundMessageTemplate[] = [];
  selectedTemplate: OutboundMessageTemplate | null = null;
  templateVariables: Record<string, string> = {};
  messageContent = '';
  sending = false;
  loadingTemplates = false;
  error: string | null = null;

  constructor(private outboundMessageService: OutboundMessageApiService) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.initializeDefaultVariables();
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.outboundMessageService.listTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loadingTemplates = false;
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.loadingTemplates = false;
      }
    });
  }

  initializeDefaultVariables(): void {
    const leadName = this.leadName();
    if (leadName) {
      this.templateVariables['name'] = leadName;
    }
  }

  onTemplateSelect(): void {
    if (this.selectedTemplate) {
      this.initializeTemplateVariables();
      this.updateMessagePreview();
    } else {
      this.templateVariables = {};
      this.messageContent = '';
      this.initializeDefaultVariables();
    }
  }

  initializeTemplateVariables(): void {
    if (!this.selectedTemplate) {
      return;
    }

    this.templateVariables = {};
    this.selectedTemplate.variables.forEach(variable => {
      const leadName = this.leadName();
      if (variable === 'name' && leadName) {
        this.templateVariables[variable] = leadName;
      } else {
        this.templateVariables[variable] = '';
      }
    });
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

  onVariableChange(): void {
    this.updateMessagePreview();
  }

  canSendMessage(): boolean {
    const recipientPhone = this.recipientPhone();
    if (!recipientPhone || recipientPhone.trim() === '') {
      return false;
    }

    if (!this.messageContent || this.messageContent.trim() === '') {
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

  sendMessage(): void {
    if (!this.canSendMessage() || this.sending) {
      return;
    }

    this.sending = true;
    this.error = null;

    const request: OutboundMessageCreateRequest = {
      dossierId: this.dossierId(),
      recipientPhone: this.recipientPhone()!,
      content: this.messageContent,
      channel: 'WHATSAPP',
      templateId: this.selectedTemplate?.id,
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined
    };

    this.outboundMessageService.create(request).subscribe({
      next: () => {
        this.sending = false;
        this.resetForm();
        // TODO: The 'emit' function requires a mandatory void argument
        this.messageSent.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Échec de l\'envoi du message';
        this.sending = false;
        console.error('Error sending message:', err);
      }
    });
  }

  resetForm(): void {
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.messageContent = '';
    this.error = null;
    this.initializeDefaultVariables();
  }

  getVariableLabel(variable: string): string {
    const labels: Record<string, string> = {
      'name': 'Nom',
      'date': 'Date',
      'time': 'Heure',
      'location': 'Lieu',
      'property': 'Bien',
      'documents': 'Documents',
      'amount': 'Montant',
      'phone': 'Téléphone'
    };
    return labels[variable] || variable;
  }

  getVariablePlaceholder(variable: string): string {
    const placeholders: Record<string, string> = {
      'name': 'Ex: Jean Dupont',
      'date': 'Ex: 25/01/2024',
      'time': 'Ex: 14:00',
      'location': 'Ex: 123 Rue de la Paix, Paris',
      'property': 'Ex: Appartement 3 pièces',
      'documents': 'Ex: pièce d\'identité, justificatif de domicile',
      'amount': 'Ex: 350 000 €',
      'phone': 'Ex: +33612345678'
    };
    return placeholders[variable] || `Saisir ${variable}`;
  }
}
