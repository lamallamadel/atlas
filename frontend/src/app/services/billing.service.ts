import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subscription {
  id: number;
  orgId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  planTier: string;
  billingPeriod: string;
  basePriceCents: number;
  includedMessages: number;
  includedStorageGb: number;
  maxUsers: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
}

export interface Usage {
  periodStart: string;
  periodEnd: string;
  emailMessages: number;
  smsMessages: number;
  whatsappMessages: number;
  totalMessages: number;
  documentsStorageBytes: number;
  attachmentsStorageBytes: number;
  totalStorageBytes: number;
  activeUsers: number;
  apiCalls: number;
  dossiersCreated: number;
}

export interface BillEstimate {
  basePriceCents: number;
  messageOverageCents: number;
  storageOverageCents: number;
  totalCents: number;
  totalDollars: number;
  includedMessages: number;
  usedMessages: number;
  overageMessages: number;
  includedStorageGb: number;
  usedStorageGb: number;
  overageStorageGb: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private baseUrl = '/api/v1/billing';

  constructor(private http: HttpClient) {}

  getSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/subscription`);
  }

  createSubscription(planTier: string, billingPeriod: string, customerEmail: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscription/create`, {
      planTier,
      billingPeriod,
      customerEmail
    });
  }

  getCurrentUsage(): Observable<Usage> {
    return this.http.get<Usage>(`${this.baseUrl}/usage/current`);
  }

  getUsageHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usage/history`);
  }

  getEstimatedBill(): Observable<BillEstimate> {
    return this.http.get<BillEstimate>(`${this.baseUrl}/estimate`);
  }
}
