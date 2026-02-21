import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeveloperPortalApiService } from '../../services/developer-portal-api.service';
import { ToastNotificationService } from '../../services/toast-notification.service';
import {
  ApiKey,
  ApiTier,
  CreateApiKeyRequest,
  WebhookSubscription,
  CreateWebhookRequest,
  WebhookStatus,
  ApiUsage,
  WebhookDelivery
} from '../../models/api-marketplace.models';

@Component({
  selector: 'app-developer-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './developer-portal.component.html',
  styleUrls: ['./developer-portal.component.scss']
})
export class DeveloperPortalComponent implements OnInit {
  activeTab: 'api-keys' | 'webhooks' | 'usage' = 'api-keys';

  // API Keys
  apiKeys: ApiKey[] = [];
  selectedApiKey?: ApiKey;
  showCreateApiKeyDialog = false;
  newApiKey: CreateApiKeyRequest = {
    name: '',
    tier: ApiTier.FREE
  };
  newlyCreatedKey?: string;

  // Webhooks
  webhooks: WebhookSubscription[] = [];
  selectedWebhook?: WebhookSubscription;
  showCreateWebhookDialog = false;
  newWebhook: CreateWebhookRequest = {
    name: '',
    url: '',
    eventType: 'dossier.created'
  };
  webhookEvents = [
    'dossier.created',
    'dossier.updated',
    'dossier.status_changed',
    'message.received',
    'message.sent',
    'appointment.scheduled',
    'appointment.updated',
    'appointment.cancelled'
  ];
  webhookDeliveries: WebhookDelivery[] = [];

  // Usage
  usageData: ApiUsage[] = [];
  selectedKeyForUsage?: number;
  usageDays = 30;

  // Enums for template
  ApiTier = ApiTier;
  WebhookStatus = WebhookStatus;

  loading = false;

  constructor(
    private developerPortalService: DeveloperPortalApiService,
    private toast: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.loadApiKeys();
    this.loadWebhooks();
  }

  // API Keys
  loadApiKeys(): void {
    this.loading = true;
    this.developerPortalService.listApiKeys().subscribe({
      next: (keys) => {
        this.apiKeys = keys;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load API keys');
        this.loading = false;
      }
    });
  }

  openCreateApiKeyDialog(): void {
    this.newApiKey = {
      name: '',
      tier: ApiTier.FREE
    };
    this.newlyCreatedKey = undefined;
    this.showCreateApiKeyDialog = true;
  }

  createApiKey(): void {
    if (!this.newApiKey.name) {
      this.toast.error('Please provide a name for the API key');
      return;
    }

    this.loading = true;
    this.developerPortalService.createApiKey(this.newApiKey).subscribe({
      next: (key) => {
        this.newlyCreatedKey = key.plainTextKey;
        this.apiKeys.push(key);
        this.toast.success('API key created successfully');
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to create API key');
        this.loading = false;
      }
    });
  }

  copyApiKey(key: string): void {
    navigator.clipboard.writeText(key).then(() => {
      this.toast.success('API key copied to clipboard');
    });
  }

  revokeApiKey(id: number): void {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    this.developerPortalService.revokeApiKey(id).subscribe({
      next: () => {
        this.apiKeys = this.apiKeys.filter(k => k.id !== id);
        this.toast.success('API key revoked');
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to revoke API key');
        this.loading = false;
      }
    });
  }

  selectApiKey(key: ApiKey): void {
    this.selectedApiKey = key;
    this.loadApiKeyUsage(key.id);
  }

  loadApiKeyUsage(keyId: number): void {
    this.loading = true;
    this.developerPortalService.getApiKeyUsage(keyId, this.usageDays).subscribe({
      next: (usage) => {
        this.usageData = usage;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load usage data');
        this.loading = false;
      }
    });
  }

  // Webhooks
  loadWebhooks(): void {
    this.loading = true;
    this.developerPortalService.listWebhooks().subscribe({
      next: (webhooks) => {
        this.webhooks = webhooks;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load webhooks');
        this.loading = false;
      }
    });
  }

  openCreateWebhookDialog(): void {
    this.newWebhook = {
      name: '',
      url: '',
      eventType: 'dossier.created'
    };
    this.showCreateWebhookDialog = true;
  }

  createWebhook(): void {
    if (!this.newWebhook.name || !this.newWebhook.url) {
      this.toast.error('Please provide name and URL');
      return;
    }

    this.loading = true;
    this.developerPortalService.createWebhook(this.newWebhook).subscribe({
      next: (webhook) => {
        this.webhooks.push(webhook);
        this.toast.success('Webhook created successfully');
        this.showCreateWebhookDialog = false;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to create webhook');
        this.loading = false;
      }
    });
  }

  selectWebhook(webhook: WebhookSubscription): void {
    this.selectedWebhook = webhook;
    this.loadWebhookDeliveries(webhook.id);
  }

  loadWebhookDeliveries(webhookId: number): void {
    this.loading = true;
    this.developerPortalService.getWebhookDeliveries(webhookId).subscribe({
      next: (response) => {
        this.webhookDeliveries = response.content;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load webhook deliveries');
        this.loading = false;
      }
    });
  }

  toggleWebhookStatus(webhook: WebhookSubscription): void {
    const newStatus = webhook.status === WebhookStatus.ACTIVE 
      ? WebhookStatus.PAUSED 
      : WebhookStatus.ACTIVE;

    this.loading = true;
    this.developerPortalService.updateWebhookStatus(webhook.id, newStatus).subscribe({
      next: () => {
        webhook.status = newStatus;
        this.toast.success(`Webhook ${newStatus.toLowerCase()}`);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to update webhook status');
        this.loading = false;
      }
    });
  }

  deleteWebhook(id: number): void {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    this.loading = true;
    this.developerPortalService.deleteWebhook(id).subscribe({
      next: () => {
        this.webhooks = this.webhooks.filter(w => w.id !== id);
        this.toast.success('Webhook deleted');
        this.selectedWebhook = undefined;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to delete webhook');
        this.loading = false;
      }
    });
  }

  copyWebhookSecret(secret: string): void {
    navigator.clipboard.writeText(secret).then(() => {
      this.toast.success('Secret copied to clipboard');
    });
  }

  getTierColor(tier: ApiTier): string {
    switch (tier) {
      case ApiTier.FREE: return 'bg-gray-100 text-gray-800';
      case ApiTier.PRO: return 'bg-blue-100 text-blue-800';
      case ApiTier.ENTERPRISE: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'DISABLED':
      case 'REVOKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getDeliveryStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'RETRY': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  calculateSuccessRate(): number {
    if (!this.selectedWebhook) return 0;
    const total = this.selectedWebhook.successCount + this.selectedWebhook.failureCount;
    if (total === 0) return 0;
    return Math.round((this.selectedWebhook.successCount / total) * 100);
  }

  getTotalRequests(): number {
    return this.usageData.reduce((sum, u) => sum + u.requestCount, 0);
  }

  getAverageResponseTime(): number {
    if (this.usageData.length === 0) return 0;
    const avg = this.usageData.reduce((sum, u) => sum + u.avgResponseTimeMs, 0) / this.usageData.length;
    return Math.round(avg);
  }

  getSuccessRate(): number {
    const totalRequests = this.getTotalRequests();
    if (totalRequests === 0) return 0;
    const totalSuccess = this.usageData.reduce((sum, u) => sum + u.successCount, 0);
    return Math.round((totalSuccess / totalRequests) * 100);
  }
}
