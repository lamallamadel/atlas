import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineService } from '../services/offline.service';
import { OfflineQueueService, QueuedActionType } from '../services/offline-queue.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  constructor(
    private offlineService: OfflineService,
    private queueService: OfflineQueueService,
    private storageService: OfflineStorageService,
    private notificationService: NotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.shouldBypassOfflineHandling(request)) {
      return next.handle(request);
    }

    if (!this.offlineService.isOnline()) {
      return this.handleOfflineRequest(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.isNetworkError(error)) {
          return this.handleOfflineRequest(request);
        }
        return throwError(() => error);
      })
    );
  }

  private shouldBypassOfflineHandling(request: HttpRequest<any>): boolean {
    const bypassUrls = [
      '/api/v1/ping',
      '/api/v1/observability'
    ];

    return bypassUrls.some(url => request.url.includes(url));
  }

  private isNetworkError(error: HttpErrorResponse): boolean {
    return error.status === 0 || 
           error.status === 504 || 
           error.statusText === 'Unknown Error';
  }

  private handleOfflineRequest(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (request.method === 'GET') {
      return this.handleOfflineGet(request);
    }

    if (this.canQueueRequest(request)) {
      return this.queueRequest(request);
    }

    this.notificationService.error(
      'Action impossible en mode hors ligne',
      'OK'
    );

    return throwError(() => new HttpErrorResponse({
      error: 'Offline',
      status: 0,
      statusText: 'Offline',
      url: request.url
    }));
  }

  private handleOfflineGet(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      this.storageService.getCachedData(request.url).then(cachedData => {
        if (cachedData) {
          observer.next(cachedData);
          observer.complete();
        } else {
          this.notificationService.warning(
            'Données non disponibles hors ligne'
          );
          observer.error(new HttpErrorResponse({
            error: 'No cached data',
            status: 0,
            statusText: 'Offline',
            url: request.url
          }));
        }
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  private canQueueRequest(request: HttpRequest<any>): boolean {
    if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'PATCH') {
      return false;
    }

    const queueableUrls = [
      '/api/v1/messages',
      '/api/v1/dossiers/',
      '/api/v1/appointments'
    ];

    return queueableUrls.some(url => request.url.includes(url));
  }

  private queueRequest(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      const actionType = this.getActionType(request);
      const localId = this.generateLocalId();

      if (!actionType) {
        observer.error(new HttpErrorResponse({
          error: 'Cannot queue this request type',
          status: 0,
          statusText: 'Offline',
          url: request.url
        }));
        return;
      }

      this.queueService.queueAction({
        type: actionType,
        payload: request.body,
        localId
      }).then(() => {
        const mockResponse: any = {
          ...request.body,
          id: localId,
          _isLocal: true,
          _queuedAt: Date.now()
        };

        observer.next(mockResponse as any);
        observer.complete();

        this.notificationService.success(
          'Action enregistrée hors ligne',
          'Voir'
        );
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  private getActionType(request: HttpRequest<any>): QueuedActionType | null {
    const url = request.url;

    if (url.includes('/api/v1/messages') && request.method === 'POST') {
      return QueuedActionType.CREATE_MESSAGE;
    }

    if (url.includes('/api/v1/dossiers') && url.includes('/status') && request.method === 'PATCH') {
      return QueuedActionType.UPDATE_DOSSIER_STATUS;
    }

    if (url.includes('/api/v1/appointments')) {
      if (request.method === 'POST') {
        return QueuedActionType.CREATE_APPOINTMENT;
      }
      if (request.method === 'PUT' || request.method === 'PATCH') {
        return QueuedActionType.UPDATE_APPOINTMENT;
      }
    }

    return null;
  }

  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
