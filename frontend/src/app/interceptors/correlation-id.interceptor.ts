import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class CorrelationIdInterceptor implements HttpInterceptor {

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
        return throwError(() => error);
      })
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
