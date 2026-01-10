import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastNotificationService } from '../services/toast-notification.service';

interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

@Injectable()
export class CorrelationIdInterceptor implements HttpInterceptor {
  private pendingRequests = new Map<string, HttpRequest<any>>();

  constructor(
    private toastService: ToastNotificationService,
    private router: Router,
    private authService: AuthService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const correlationId = this.generateCorrelationId();

    const modifiedReq = req.clone({
      setHeaders: {
        'X-Correlation-Id': correlationId
      }
    });

    this.pendingRequests.set(correlationId, modifiedReq);

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`HTTP Error [${correlationId}]:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          correlationId: correlationId
        });

        this.handleError(error, modifiedReq, correlationId);
        this.pendingRequests.delete(correlationId);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse, originalRequest: HttpRequest<any>, correlationId: string): void {
    const problemDetail = this.parseProblemDetail(error);

    switch (error.status) {
      case 401:
        this.toastService.error(
          'Session expirée. Veuillez vous reconnecter.',
          'Reconnecter',
          () => {
            this.authService.handleSessionExpired();
          }
        );
        break;

      case 403:
        this.toastService.error(
          "Accès refusé. Vous n'avez pas les droits nécessaires.",
          'Fermer'
        );
        break;

      case 400: {
        const badRequestMessage = problemDetail?.detail || 'Requête invalide. Veuillez vérifier votre saisie.';
        this.toastService.error(badRequestMessage, 'Fermer');
        break;
      }

      case 404: {
        const notFoundMessage = problemDetail?.detail || 'La ressource demandée est introuvable.';
        this.toastService.error(notFoundMessage, 'Fermer');
        break;
      }

      case 409: {
        const conflictMessage = problemDetail?.detail || 'Un conflit est survenu. Veuillez réessayer.';
        this.toastService.warning(
          conflictMessage,
          'Réessayer',
          () => this.retryRequest(originalRequest, correlationId)
        );
        break;
      }

      case 500: {
        const serverErrorMessage = problemDetail?.detail || 'Une erreur interne est survenue.';
        this.toastService.error(
          serverErrorMessage,
          'Réessayer',
          () => this.retryRequest(originalRequest, correlationId)
        );
        break;
      }

      case 0:
      case 504:
      case 503: {
        this.toastService.error(
          'Impossible de contacter le serveur. Vérifiez votre connexion.',
          'Réessayer',
          () => this.retryRequest(originalRequest, correlationId)
        );
        break;
      }

      default: {
        if (error.status >= 500) {
          this.toastService.error(
            'Une erreur serveur est survenue.',
            'Réessayer',
            () => this.retryRequest(originalRequest, correlationId)
          );
        }
        break;
      }
    }
  }

  private retryRequest(request: HttpRequest<any>, correlationId: string): void {
    console.log(`Retrying request [${correlationId}]:`, request.url);
    window.location.reload();
  }

  private parseProblemDetail(error: HttpErrorResponse): ProblemDetail | null {
    if (!error.error) {
      return null;
    }

    if (typeof error.error === 'object' &&
      ('detail' in error.error || 'title' in error.error || 'type' in error.error)) {
      return error.error as ProblemDetail;
    }

    return null;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
