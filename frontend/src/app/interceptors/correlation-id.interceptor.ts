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
        this.snackBar.open('Session expired. Please login again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/login']);
        break;

      case 403:
        this.snackBar.open('Access denied. You do not have permission to perform this action.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;

      case 400: {
        const badRequestMessage = problemDetail?.detail || 'Invalid request. Please check your input.';
        this.snackBar.open(badRequestMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 404: {
        const notFoundMessage = problemDetail?.detail || 'The requested resource was not found.';
        this.snackBar.open(notFoundMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 409: {
        const conflictMessage = problemDetail?.detail || 'A conflict occurred. Please try again.';
        this.snackBar.open(conflictMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        break;
      }

      case 500: {
        const serverErrorMessage = problemDetail?.detail || 'An internal server error occurred. Please try again later.';
        this.snackBar.open(serverErrorMessage, 'Close', {
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
