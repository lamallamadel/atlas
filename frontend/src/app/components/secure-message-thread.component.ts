import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientSecureMessage } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';
import { CryptoService } from '../services/crypto.service';

@Component({
  selector: 'app-secure-message-thread',
  template: `
    <div class="message-container">
      <h2>Messages sécurisés</h2>
    
      <div class="messages-list">
        @for (message of decryptedMessages; track message) {
          <div
            [class.from-client]="message.fromClient"
            [class.from-agent]="!message.fromClient"
            class="message-bubble">
            <div class="message-content">{{ message.decryptedContent }}</div>
            <div class="message-time">{{ message.createdAt | date:'short' }}</div>
          </div>
        }
      </div>
    
      <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
        <textarea
          formControlName="content"
          placeholder="Écrivez votre message..."
          rows="3"
        class="message-input"></textarea>
        <button type="submit"
          [disabled]="!messageForm.valid || sending"
          class="send-button">
          @if (!sending) {
            <span>📩 Envoyer</span>
          }
          @if (sending) {
            <span>⏳ Envoi...</span>
          }
        </button>
      </form>
    </div>
    `,
  styles: [`
    .message-container {
      padding: var(--ds-space-6);
      background: var(--ds-surface);
      border-radius: var(--ds-radius-md);
      border: 1px solid var(--ds-divider);
      box-shadow: var(--ds-shadow-sm);
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 var(--ds-space-6) 0;
      font-size: 20px;
      color: var(--ds-text);
    }

    .messages-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: var(--ds-space-6);
      padding: var(--ds-space-4);
      background: var(--ds-surface-offset);
      border-radius: var(--ds-radius-md);
    }

    .message-bubble {
      margin-bottom: var(--ds-space-4);
      padding: var(--ds-space-3) var(--ds-space-4);
      border-radius: var(--ds-radius-lg);
      max-width: 70%;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .from-client {
      background: var(--ds-marine);
      color: var(--ds-text-inverse);
      margin-left: auto;
      text-align: right;
    }

    .from-agent {
      background: var(--ds-surface);
      color: var(--ds-text);
      border: 1px solid var(--ds-divider);
      margin-right: auto;
      text-align: left;
    }

    .message-content {
      margin-bottom: var(--ds-space-1);
      word-wrap: break-word;
    }

    .message-time {
      font-size: 12px;
      opacity: 0.7;
    }

    .message-form {
      display: flex;
      gap: var(--ds-space-3);
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      padding: var(--ds-space-3);
      border: 1px solid var(--ds-divider);
      border-radius: var(--ds-radius-md);
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      background: var(--ds-surface);
      color: var(--ds-text);
    }

    .message-input:focus {
      outline: none;
      border-color: var(--ds-marine);
    }

    .send-button {
      padding: var(--ds-space-3) var(--ds-space-6);
      background: var(--ds-marine);
      color: var(--ds-text-inverse);
      border: none;
      border-radius: var(--ds-radius-md);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background var(--ds-transition-fast);
    }

    .send-button:hover:not(:disabled) {
      background: var(--ds-marine-hover);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SecureMessageThreadComponent implements OnInit {
  @Input() dossierId!: number;
  messages: ClientSecureMessage[] = [];
  decryptedMessages: any[] = [];
  messageForm: FormGroup;
  sending = false;

  constructor(
    private fb: FormBuilder,
    private portalService: CustomerPortalService,
    private cryptoService: CryptoService
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.portalService.getMessages(this.dossierId).subscribe({
      next: async (messages) => {
        this.messages = messages;
        this.decryptedMessages = await Promise.all(
          messages.map(async (msg) => {
            try {
              const decrypted = await this.cryptoService.decrypt(
                msg.encryptedContent,
                msg.initializationVector
              );
              return { ...msg, decryptedContent: decrypted };
            } catch (e) {
              return { ...msg, decryptedContent: '[Message chiffré]' };
            }
          })
        );
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.messageForm.valid || this.sending) return;

    const content = this.messageForm.value.content;
    this.sending = true;

    try {
      const { encrypted, iv } = await this.cryptoService.encrypt(content);
      
      this.portalService.sendMessage(this.dossierId, encrypted, iv).subscribe({
        next: () => {
          this.messageForm.reset();
          this.loadMessages();
          this.sending = false;
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.sending = false;
        }
      });
    } catch (e) {
      console.error('Encryption error:', e);
      this.sending = false;
    }
  }
}
