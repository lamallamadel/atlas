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
        <div *ngFor="let message of decryptedMessages" 
             [class.from-client]="message.fromClient"
             [class.from-agent]="!message.fromClient"
             class="message-bubble">
          <div class="message-content">{{ message.decryptedContent }}</div>
          <div class="message-time">{{ message.createdAt | date:'short' }}</div>
        </div>
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
          <span *ngIf="!sending">📩 Envoyer</span>
          <span *ngIf="sending">⏳ Envoi...</span>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .message-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #333;
    }

    .messages-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .message-bubble {
      margin-bottom: 16px;
      padding: 12px 16px;
      border-radius: 12px;
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
      background: #667eea;
      color: white;
      margin-left: auto;
      text-align: right;
    }

    .from-agent {
      background: white;
      color: #333;
      border: 1px solid #e0e0e0;
      margin-right: auto;
      text-align: left;
    }

    .message-content {
      margin-bottom: 4px;
      word-wrap: break-word;
    }

    .message-time {
      font-size: 12px;
      opacity: 0.7;
    }

    .message-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .send-button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .send-button:hover:not(:disabled) {
      background: #5568d3;
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
