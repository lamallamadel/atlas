import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, AfterViewChecked, ChangeDetectorRef, HostListener } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  MessageApiService, 
  MessageChannel, 
  MessageDirection, 
  MessageResponse, 
  MessageDeliveryStatus,
  MessageCreateRequest 
} from '../services/message-api.service';
import { 
  OutboundMessageApiService, 
  OutboundMessageTemplate 
} from '../services/outbound-message-api.service';
import { 
  ConsentementApiService, 
  ConsentementChannel, 
  ConsentementStatus,
  ConsentementResponse 
} from '../services/consentement-api.service';
import { TemplateSelectionSheetComponent } from './template-selection-sheet.component';

export interface MessageAttachment {
  file: File;
  preview?: string;
  type: 'image' | 'document';
  error?: string;
}

@Component({
  selector: 'app-whatsapp-messaging-ui',
  templateUrl: './whatsapp-messaging-ui.component.html',
  styleUrls: ['./whatsapp-messaging-ui.component.css']
})
export class WhatsappMessagingUiComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() dossierId!: number;
  @Input() recipientPhone?: string;
  @Input() recipientName?: string;
  @Output() messageActionEvent = new EventEmitter<{ type: string; message: MessageResponse }>();

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  @ViewChild('messageInput') messageInputRef?: any;
  @ViewChild('fileInput') fileInput?: any;

  messages: MessageResponse[] = [];
  templates: OutboundMessageTemplate[] = [];
  selectedTemplate: OutboundMessageTemplate | null = null;
  templateVariables: Record<string, string> = {};
  
  messageContent = '';
  loading = false;
  sending = false;
  isOnline = navigator.onLine;
  
  consent: ConsentementResponse | null = null;
  consentChecked = false;
  hasValidConsent = false;
  
  attachments: MessageAttachment[] = [];
  maxFileSize = 16 * 1024 * 1024; // 16MB
  maxImageSize = 5 * 1024 * 1024; // 5MB
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  isMobile = false;
  
  MessageDirection = MessageDirection;
  MessageDeliveryStatus = MessageDeliveryStatus;
  Math = Math;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private statusRefreshInterval = 5000;

  swipedMessageId: number | null = null;
  swipeOffset = 0;
  isSwiping = false;
  startX = 0;

  constructor(
    private messageApiService: MessageApiService,
    private outboundMessageApiService: OutboundMessageApiService,
    private consentementApiService: ConsentementApiService,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
    this.setupOnlineStatusMonitoring();
    this.loadConsent();
    this.loadTemplates();
    this.loadMessages();
    this.setupStatusRefresh();
    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.viewport) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
  }

  @HostListener('window:online')
  onOnline(): void {
    this.isOnline = true;
    this.showSnackbar('✓ Connexion rétablie', 'success');
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOnline = false;
    this.showSnackbar('⚠️ Mode hors ligne', 'warning');
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private setupOnlineStatusMonitoring(): void {
    this.isOnline = navigator.onLine;
  }

  private setupStatusRefresh(): void {
    interval(this.statusRefreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshPendingMessageStatuses();
      });
  }

  private refreshPendingMessageStatuses(): void {
    const pendingMessages = this.messages.filter(m => 
      m.deliveryStatus === MessageDeliveryStatus.PENDING || 
      m.deliveryStatus === MessageDeliveryStatus.SENT
    );

    if (pendingMessages.length === 0) {
      return;
    }

    pendingMessages.forEach(message => {
      this.messageApiService.getById(message.id).subscribe({
        next: (updated) => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1 && updated.deliveryStatus !== message.deliveryStatus) {
            this.messages[index] = updated;
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error refreshing message status:', err)
      });
    });
  }

  private loadConsent(): void {
    this.consentementApiService.list({
      dossierId: this.dossierId,
      channel: ConsentementChannel.WHATSAPP
    }).subscribe({
      next: (response) => {
        this.consentChecked = true;
        if (response.content.length > 0) {
          this.consent = response.content[0];
          this.hasValidConsent = this.consent.status === ConsentementStatus.GRANTED;
        }
      },
      error: (err) => {
        console.error('Error loading consent:', err);
        this.consentChecked = true;
      }
    });
  }

  private loadTemplates(): void {
    this.outboundMessageApiService.listTemplates().subscribe({
      next: (templates) => {
        this.templates = templates.filter(t => t.channel === 'WHATSAPP');
      },
      error: (err) => {
        console.error('Error loading templates:', err);
      }
    });
  }

  loadMessages(): void {
    this.loading = true;
    this.messageApiService.list({
      dossierId: this.dossierId,
      channel: MessageChannel.WHATSAPP,
      size: 100,
      sort: 'timestamp,asc'
    }).subscribe({
      next: (response) => {
        this.messages = response.content;
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.loading = false;
        this.showSnackbar('Erreur lors du chargement des messages', 'error');
      }
    });
  }

  openTemplateSelector(): void {
    const sheetOrDialog = this.isMobile ? 
      this.bottomSheet.open(TemplateSelectionSheetComponent, {
        data: { 
          templates: this.templates,
          currentTemplate: this.selectedTemplate
        },
        panelClass: 'template-bottom-sheet',
        backdropClass: 'template-bottom-sheet-backdrop'
      }) : 
      this.bottomSheet.open(TemplateSelectionSheetComponent, {
        data: { 
          templates: this.templates,
          currentTemplate: this.selectedTemplate
        },
        panelClass: 'template-bottom-sheet-desktop',
      });

    sheetOrDialog.afterDismissed().subscribe((result: any) => {
      if (result) {
        this.onTemplateSelected(result.template);
      }
    });
  }

  onTemplateSelected(template: OutboundMessageTemplate | null): void {
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
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    this.messageContent = preview;
  }

  removeTemplate(): void {
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.messageContent = '';
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (this.attachments.length >= 10) {
        this.showSnackbar('Maximum 10 fichiers autorisés', 'error');
        break;
      }

      const attachment = this.validateAndCreateAttachment(file);
      if (attachment) {
        this.attachments.push(attachment);
        
        if (attachment.type === 'image') {
          this.generateImagePreview(attachment);
        }
      }
    }
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private validateAndCreateAttachment(file: File): MessageAttachment | null {
    const isImage = this.allowedImageTypes.includes(file.type);
    const isDocument = this.allowedDocumentTypes.includes(file.type);
    
    if (!isImage && !isDocument) {
      this.showSnackbar(`Type de fichier non supporté: ${file.name}`, 'error');
      return null;
    }
    
    const maxSize = isImage ? this.maxImageSize : this.maxFileSize;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      this.showSnackbar(`${file.name} dépasse la taille maximale de ${maxSizeMB}MB`, 'error');
      return null;
    }
    
    return {
      file,
      type: isImage ? 'image' : 'document'
    };
  }

  private generateImagePreview(attachment: MessageAttachment): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      attachment.preview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(attachment.file);
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  autoGrow(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey && !this.isMobile) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  canSend(): boolean {
    if (!this.hasValidConsent) {
      return false;
    }

    if (!this.messageContent || this.messageContent.trim() === '') {
      return false;
    }

    if (this.sending || !this.isOnline) {
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
    if (!this.canSend()) {
      return;
    }

    this.sending = true;

    const request: MessageCreateRequest = {
      dossierId: this.dossierId,
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      content: this.messageContent.trim(),
      timestamp: new Date().toISOString(),
      templateId: this.selectedTemplate?.id,
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined
    };

    this.messageApiService.create(request).subscribe({
      next: (newMessage) => {
        this.messages.push(newMessage);
        this.shouldScrollToBottom = true;
        this.sending = false;
        this.resetInput();
        this.showSnackbar('Message envoyé', 'success');
      },
      error: (err) => {
        this.sending = false;
        const errorMessage = err.error?.message || 'Échec de l\'envoi du message';
        this.showSnackbar(errorMessage, 'error');
        console.error('Error sending message:', err);
      }
    });
  }

  private resetInput(): void {
    this.messageContent = '';
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.attachments = [];
    
    if (this.messageInputRef) {
      const textarea = this.messageInputRef.nativeElement;
      textarea.style.height = 'auto';
    }
  }

  scrollToBottom(): void {
    if (this.viewport) {
      this.viewport.scrollToIndex(this.messages.length - 1, 'smooth');
    }
  }

  onTouchStart(event: TouchEvent, message: MessageResponse): void {
    if (message.direction !== MessageDirection.OUTBOUND) {
      return;
    }

    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.swipedMessageId = message.id;
  }

  onTouchMove(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const diffX = currentX - this.startX;

    if (diffX < 0 && diffX > -150) {
      this.swipeOffset = diffX;
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) {
      return;
    }

    this.isSwiping = false;
    this.swipeOffset = 0;
    this.swipedMessageId = null;
  }

  retryMessage(message: MessageResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.messageApiService.retry(message.id).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m.id === message.id);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
        }
        this.showSnackbar('Message en cours de renvoi...', 'info');
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec du renvoi du message';
        this.showSnackbar(errorMessage, 'error');
        console.error('Error retrying message:', err);
      }
    });
  }

  copyMessage(message: MessageResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard.writeText(message.content);
    this.showSnackbar('Message copié', 'success');
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  getDeliveryStatusIcon(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'schedule';
      case MessageDeliveryStatus.SENT: return 'done';
      case MessageDeliveryStatus.DELIVERED: return 'done_all';
      case MessageDeliveryStatus.FAILED: return 'error';
      case MessageDeliveryStatus.READ: return 'done_all';
      default: return '';
    }
  }

  getDeliveryStatusClass(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'status-pending';
      case MessageDeliveryStatus.SENT: return 'status-sent';
      case MessageDeliveryStatus.DELIVERED: return 'status-delivered';
      case MessageDeliveryStatus.FAILED: return 'status-failed';
      case MessageDeliveryStatus.READ: return 'status-read';
      default: return '';
    }
  }

  showDateDivider(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const currentDate = new Date(this.messages[index].timestamp);
    const previousDate = new Date(this.messages[index - 1].timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
  }

  getDateDividerText(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getSwipeTransform(messageId: number): string {
    if (this.swipedMessageId === messageId && this.isSwiping) {
      return `translateX(${this.swipeOffset}px)`;
    }
    return 'translateX(0)';
  }

  trackByMessageId(index: number, message: MessageResponse): number {
    return message.id;
  }

  getPlaceholder(): string {
    if (!this.hasValidConsent && this.consentChecked) {
      return 'Consentement WhatsApp requis';
    }
    if (!this.isOnline) {
      return 'Mode hors ligne';
    }
    if (this.selectedTemplate) {
      return 'Remplissez les variables du modèle';
    }
    return 'Tapez un message...';
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: type === 'error' ? 5000 : 3000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'center',
      verticalPosition: this.isMobile ? 'bottom' : 'top'
    });
  }

  getConsentWarningMessage(): string {
    if (!this.consentChecked) {
      return 'Vérification du consentement...';
    }
    if (!this.consent) {
      return '⚠️ Aucun consentement WhatsApp enregistré. Veuillez obtenir le consentement avant d\'envoyer des messages.';
    }
    if (this.consent.status === ConsentementStatus.DENIED) {
      return '⚠️ Le contact a refusé de recevoir des messages WhatsApp.';
    }
    if (this.consent.status === ConsentementStatus.REVOKED) {
      return '⚠️ Le consentement WhatsApp a été révoqué par le contact.';
    }
    if (this.consent.status === ConsentementStatus.EXPIRED) {
      return '⚠️ Le consentement WhatsApp a expiré. Veuillez le renouveler.';
    }
    return '';
  }

  getAttachmentIcon(attachment: MessageAttachment): string {
    return attachment.type === 'image' ? 'image' : 'description';
  }

  getAttachmentSize(attachment: MessageAttachment): string {
    const bytes = attachment.file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
