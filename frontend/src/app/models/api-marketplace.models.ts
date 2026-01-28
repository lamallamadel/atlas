export interface ApiKey {
  id: number;
  name: string;
  description?: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  tier: ApiTier;
  scopes?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  plainTextKey?: string;
}

export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED'
}

export enum ApiTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  tier: ApiTier;
  scopes?: string;
  expiresAt?: string;
}

export interface WebhookSubscription {
  id: number;
  name: string;
  url: string;
  eventType: string;
  status: WebhookStatus;
  description?: string;
  retryPolicy?: RetryPolicy;
  lastTriggeredAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount: number;
  successCount: number;
  createdAt: string;
  secret?: string;
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED'
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelaySeconds: number;
  backoffStrategy: 'exponential' | 'fixed';
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  eventType: string;
  description?: string;
  retryPolicy?: RetryPolicy;
}

export interface WebhookDelivery {
  id: number;
  eventType: string;
  status: DeliveryStatus;
  attemptCount: number;
  lastAttemptAt?: string;
  responseStatusCode?: number;
  errorMessage?: string;
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY = 'RETRY'
}

export interface ApiUsage {
  date: string;
  endpoint: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTimeMs: number;
}

export interface ApiUsageSummary {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  topEndpoints: { endpoint: string; count: number }[];
}
