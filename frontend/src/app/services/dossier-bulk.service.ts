import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DossierApiService, DossierBulkAssignRequest, BulkOperationResponse, DossierStatus } from './dossier-api.service';
import { BulkOperationService } from './bulk-operation.service';

@Injectable({
  providedIn: 'root'
})
export class DossierBulkService {
  constructor(
    private dossierApi: DossierApiService,
    private bulkOperationService: BulkOperationService
  ) {}

  bulkAssignStatus(
    ids: number[],
    status: DossierStatus,
    reason?: string,
    userId?: string
  ): Observable<BulkOperationResponse> {
    const request: DossierBulkAssignRequest = {
      ids,
      status,
      reason,
      userId
    };

    return this.bulkOperationService.executeBulkOperation(
      this.dossierApi.bulkAssign(request),
      {
        title: 'Attribution en masse',
        message: `Changement de statut de ${ids.length} dossier(s)...`,
        totalCount: ids.length
      }
    );
  }
}
