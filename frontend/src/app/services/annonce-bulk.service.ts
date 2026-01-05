import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnnonceApiService, AnnonceBulkUpdateRequest, BulkOperationResponse, AnnonceStatus } from './annonce-api.service';
import { BulkOperationService } from './bulk-operation.service';

@Injectable({
  providedIn: 'root'
})
export class AnnonceBulkService {
  constructor(
    private annonceApi: AnnonceApiService,
    private bulkOperationService: BulkOperationService
  ) {}

  bulkUpdateStatus(ids: number[], status: AnnonceStatus): Observable<BulkOperationResponse> {
    const request: AnnonceBulkUpdateRequest = {
      ids,
      updates: { status }
    };

    return this.bulkOperationService.executeBulkOperation(
      this.annonceApi.bulkUpdate(request),
      {
        title: 'Mise à jour en masse',
        message: `Mise à jour du statut de ${ids.length} annonce(s)...`,
        totalCount: ids.length
      }
    );
  }

  bulkUpdateCity(ids: number[], city: string): Observable<BulkOperationResponse> {
    const request: AnnonceBulkUpdateRequest = {
      ids,
      updates: { city }
    };

    return this.bulkOperationService.executeBulkOperation(
      this.annonceApi.bulkUpdate(request),
      {
        title: 'Mise à jour en masse',
        message: `Mise à jour de la ville de ${ids.length} annonce(s)...`,
        totalCount: ids.length
      }
    );
  }

  bulkUpdate(ids: number[], updates: { status?: AnnonceStatus; city?: string }): Observable<BulkOperationResponse> {
    const request: AnnonceBulkUpdateRequest = {
      ids,
      updates
    };

    return this.bulkOperationService.executeBulkOperation(
      this.annonceApi.bulkUpdate(request),
      {
        title: 'Mise à jour en masse',
        message: `Mise à jour de ${ids.length} annonce(s)...`,
        totalCount: ids.length
      }
    );
  }
}
