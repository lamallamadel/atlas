import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TenantProvisioningRequest {
  orgId: string;
  companyName: string;
  adminUserEmail: string;
  adminUserName?: string;
  planTier?: string;
  includeSampleData?: boolean;
}

export interface TenantProvisioning {
  id: number;
  orgId: string;
  status: string;
  provisioningStep: string;
  progressPercent: number;
  planTier: string;
  adminUserEmail: string;
  adminUserName: string;
  companyName: string;
  includeSampleData: boolean;
  sampleDataGenerated: boolean;
  provisioningStartedAt?: string;
  provisioningCompletedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantProvisioningService {
  private baseUrl = '/api/v1/admin/provisioning';

  constructor(private http: HttpClient) {}

  initiateProvisioning(request: TenantProvisioningRequest): Observable<TenantProvisioning> {
    return this.http.post<TenantProvisioning>(`${this.baseUrl}/initiate`, request);
  }

  provisionTenant(orgId: string): Observable<{ message: string; orgId: string }> {
    return this.http.post<{ message: string; orgId: string }>(
      `${this.baseUrl}/${orgId}/provision`,
      {}
    );
  }

  getProvisioningStatus(orgId: string): Observable<TenantProvisioning> {
    return this.http.get<TenantProvisioning>(`${this.baseUrl}/${orgId}/status`);
  }
}
