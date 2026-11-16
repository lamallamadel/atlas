import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef, HostListener, input, output, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
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
import { FormsModule } from '@angular/forms';
import { 
  DsButtonComponent,
  DsIconComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsFilterChipComponent,
  DsCardComponent,
  DsBadgeComponent,
  DsAvatarComponent,
  DsEmptyStateComponent,
  DsToastService,
  DsDialogService
} from '../design-system';

export interface MessageAttachment {
  file: File;
  preview?: string;
  type: 'image' | 'document';
  error?: string;
}

@Component({
    selector: 'app-whatsapp-messaging-ui',
    standalone: true,
    templateUrl: './whatsapp-messaging-ui.component.html',
    styleUrls: ['./whatsapp-messaging-ui.component.scss'],
    imports: [
      CommonModule,
      FormsModule,
      CdkVirtualScrollViewport,
      CdkFixedSizeVirtualScroll,
      CdkVirtualForOf,
      DsButtonComponent,
      DsIconComponent,
      DsInputComponent,
      DsSkeletonComponent,
      DsFilterChipComponent,
      DsCardComponent,
      DsBadgeComponent,
      DsAvatarComponent,
      DsEmptyStateComponent
    ],
})
export class WhatsappMessagingUiComponent implements OnInit, OnDestroy, AfterViewChecked {
  private messageApiService = inject(MessageApiService);
  private outboundMessageApiService = inject(OutboundMessageApiService);
  private consentementApiService = inject(ConsentementApiService);
  private dsDialogService = inject(DsDialogService);
  private toastService = inject(DsToastService);
  private cdr = inject(ChangeDetectorRef);

  readonly dossierId = input.required<number>();
  readonly recipientPhone = input<string>();
  readonly recipientName = input<string>();
  readonly messageActionEvent = output<{
    type: string;
    message: MessageResponse;
  }>();

  readonly viewport = viewChild(CdkVirtualScrollViewport);
  readonly messageInputRef = viewChild<any>('messageInput');
  readonly fileInput = viewChild<any>('fileInput');

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
    if (this.shouldScrollToBottom && this.viewport()) {
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
    this.toastService.success('Connexion rétablie');
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOnline = false;
    this.toastService.warning('Mode hors ligne');
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

    if (pendingMessages.length === 0) return;

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
      dossierId: this.dossierId(),
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
      dossierId: this.dossierId(),
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
        this.toastService.error('Erreur lors du chargement des messages');
      }
    });
  }

  openTemplateSelector(): void {
    const dialogRef = this.dsDialogService.open<any>(TemplateSelectionSheetComponent, {
      panelClass: this.isMobile ? 'ds-dialog-panel--bottom-sheet' : 'template-selection-dialog',
      data: { templates: this.templates, currentTemplate: this.selectedTemplate }
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result) this.onTemplateSelected(result.template);
    });
  }

  onTemplateSelected(template: OutboundMessageTemplate | null): void {
    this.selectedTemplate = template;
    if (template) {
      this.templateVariables = {};
      template.variables.forEach(variable => { this.templateVariables[variable] = ''; });
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
    if (!this.selectedTemplate) return;
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
        this.toastService.error('Maximum 10 fichiers autorisés');
        break;
      }
      const attachment = this.validateAndCreateAttachment(file);
      if (attachment) {
        this.attachments.push(attachment);
        if (attachment.type === 'image') this.generateImagePreview(attachment);
      }
    }
    const fileInput = this.fileInput();
    if (fileInput) fileInput.nativeElement.value = '';
  }

  private validateAndCreateAttachment(file: File): MessageAttachment | null {
    const isImage = this.allowedImageTypes.includes(file.type);
    const isDocument = this.allowedDocumentTypes.includes(file.type);
    if (!isImage && !isDocument) {
      this.toastService.error(`Type de fichier non supporté: ${file.name}`);
      return null;
    }
    const maxSize = isImage ? this.maxImageSize : this.maxFileSize;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      this.toastService.error(`${file.name} dépasse ${maxSizeMB}MB`);
      return null;
    }
    return { file, type: isImage ? 'image' : 'document' };
  }

  private generateImagePreview(attachment: MessageAttachment): void {
    const reader = new FileReader();
    reader.onload = (e: any) => { attachment.preview = e.target.result; this.cdr.detectChanges(); };
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
    if (!this.hasValidConsent || !this.messageContent?.trim() || this.sending || !this.isOnline) return false;
    if (this.selectedTemplate) {
      return !this.selectedTemplate.variables.some(v => !this.templateVariables[v]?.trim());
    }
    return true;
  }

  sendMessage(): void {
    if (!this.canSend()) return;
    this.sending = true;
    const request: MessageCreateRequest = {
      dossierId: this.dossierId(),
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
        this.toastService.success('Message envoyé');
      },
      error: (err) => {
        this.sending = false;
        this.toastService.error(err.error?.message || 'Échec de l\'envoi');
        console.error('Error sending message:', err);
      }
    });
  }

  private resetInput(): void {
    this.messageContent = '';
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.attachments = [];
    const messageInputRef = this.messageInputRef();
    if (messageInputRef) messageInputRef.nativeElement.style.height = 'auto';
  }

  scrollToBottom(): void {
    const viewport = this.viewport();
    if (viewport) viewport.scrollToIndex(this.messages.length - 1, 'smooth');
  }

  onTouchStart(event: TouchEvent, message: MessageResponse): void {
    if (message.direction !== MessageDirection.OUTBOUND) return;
    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.swipedMessageId = message.id;
  }

  onTouchMove(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) return;
    const diffX = event.touches[0].clientX - this.startX;
    if (diffX < 0 && diffX > -150) {
      this.swipeOffset = diffX;
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent, message: MessageResponse): void {
    if (!this.isSwiping || this.swipedMessageId !== message.id) return;
    this.isSwiping = false;
    this.swipeOffset = 0;
    this.swipedMessageId = null;
  }

  retryMessage(message: MessageResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.messageApiService.retry(message.id).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m.id === message.id);
        if (index !== -1) this.messages[index] = updatedMessage;
        this.toastService.info('Message en cours de renvoi...');
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Échec du renvoi');
        console.error('Error retrying message:', err);
      }
    });
  }

  copyMessage(message: MessageResponse, event?: Event): void {
    if (event) event.stopPropagation();
    navigator.clipboard.writeText(message.content);
    this.toastService.success('Message copié');
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getDeliveryStatusIcon(status?: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'clock';
      case MessageDeliveryStatus.SENT: 
      case MessageDeliveryStatus.DELIVERED: 
      case MessageDeliveryStatus.READ: return 'check';
      case MessageDeliveryStatus.FAILED: return 'close';
      default: return '';
    }
  }

  showDateDivider(index: number): boolean {
    if (index === 0) return true;
    return new Date(this.messages[index].timestamp).toDateString() !== new Date(this.messages[index - 1].timestamp).toDateString();
  }

  getDateDividerText(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }

  getSwipeTransform(messageId: number): string {
    return (this.swipedMessageId === messageId && this.isSwiping) ? `translateX(${this.swipeOffset}px)` : 'translateX(0)';
  }

  trackByMessageId(index: number, message: MessageResponse): number { return message.id; }

  getPlaceholder(): string {
    if (!this.hasValidConsent && this.consentChecked) return 'Consentement WhatsApp requis';
    if (!this.isOnline) return 'Mode hors ligne';
    if (this.selectedTemplate) return 'Remplissez les variables';
    return 'Tapez un message...';
  }

  getConsentWarningMessage(): string {
    if (!this.consentChecked) return 'Vérification...';
    if (!this.consent) return '⚠️ Aucun consentement WhatsApp enregistré.';
    if (this.consent.status === ConsentementStatus.DENIED) return '⚠️ Le contact a refusé WhatsApp.';
    if (this.consent.status === ConsentementStatus.REVOKED) return '⚠️ Consentement révoqué.';
    if (this.consent.status === ConsentementStatus.EXPIRED) return '⚠️ Consentement expiré.';
    return '';
  }

  getAttachmentIcon(attachment: MessageAttachment): string { return attachment.type === 'image' ? 'image' : 'folder'; }
  getAttachmentSize(attachment: MessageAttachment): string { return (attachment.file.size / 1024).toFixed(1) + ' KB'; }
}
