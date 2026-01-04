import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

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

  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // IMPORTANT:
    // - Only add correlation headers to backend API calls.
    // - Do NOT add custom headers to Keycloak/OIDC discovery requests, otherwise the browser
    //   will perform a CORS preflight that typically fails (Keycloak won't allow X-Correlation-Id
    //   unless explicitly configured).
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const correlationId = this.generateCorrelationId();
    
    const modifiedReq = req.clone({
      setHeaders: {
        'X-Correlation-Id': correlationId
      }
    });

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`HTTP Error [${correlationId}]:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          correlationId: correlationId
        });

        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    const problemDetail = this.parseProblemDetail(error);
    
    switch (error.status) {
      case 401:
        this.snackBar.open('Session expirée. Veuillez vous reconnecter.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/login']);
        break;

      case 403:
        this.snackBar.open("Accès refusé. Vous n'avez pas les droits nécessaires.", 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;

      case 400: {
        const badRequestMessage = problemDetail?.detail || 'Requête invalide. Veuillez vérifier votre saisie.';
        this.snackBar.open(badRequestMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 404: {
        const notFoundMessage = problemDetail?.detail || 'La ressource demandée est introuvable.';
        this.snackBar.open(notFoundMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 409: {
        const conflictMessage = problemDetail?.detail || 'Un conflit est survenu. Veuillez réessayer.';
        this.snackBar.open(conflictMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 500: {
        const serverErrorMessage = problemDetail?.detail || 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
        this.snackBar.open(serverErrorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }
    }
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
