import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { OutboundMessageApiService, OutboundMessageTemplate, OutboundMessageCreateRequest } from '../../services/outbound-message-api.service';

@Component({
  selector: 'app-outbound-message-form',
  templateUrl: './outbound-message-form.component.html',
  styleUrls: ['./outbound-message-form.component.css']
})
export class OutboundMessageFormComponent implements OnInit {
  @Input() dossierId!: number;
  @Input() recipientPhone?: string;
  @Input() leadName?: string;
  @Output() messageSent = new EventEmitter<void>();

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
    if (this.leadName) {
      this.templateVariables['name'] = this.leadName;
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
      if (variable === 'name' && this.leadName) {
        this.templateVariables[variable] = this.leadName;
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
    if (!this.recipientPhone || this.recipientPhone.trim() === '') {
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
      dossierId: this.dossierId,
      recipientPhone: this.recipientPhone!,
      content: this.messageContent,
      channel: 'WHATSAPP',
      templateId: this.selectedTemplate?.id,
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined
    };

    this.outboundMessageService.create(request).subscribe({
      next: () => {
        this.sending = false;
        this.resetForm();
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
