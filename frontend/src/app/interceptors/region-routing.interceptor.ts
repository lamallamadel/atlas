import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { RegionRoutingService } from '../services/region-routing.service';

@Injectable()
export class RegionRoutingInterceptor implements HttpInterceptor {
  private readonly REQUEST_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private regionRoutingService: RegionRoutingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isExternalRequest(request)) {
      return next.handle(request);
    }

    const regionEndpoint = this.regionRoutingService.getApiEndpoint();
    const currentRegion = this.regionRoutingService.getCurrentRegion();

    if (!currentRegion) {
      console.warn('No region selected, using default endpoint');
      return next.handle(request);
    }

    const modifiedRequest = request.clone({
      url: this.buildRegionalUrl(request.url, regionEndpoint),
      setHeaders: {
        'X-Region': currentRegion.name,
        'X-Request-Id': this.generateRequestId()
      }
    });

    const startTime = performance.now();

    return next.handle(modifiedRequest).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status >= 500 || error.status === 0) {
              console.warn(`Retrying request to ${currentRegion.name}, attempt ${retryCount}`);
              return new Observable(subscriber => {
                setTimeout(() => subscriber.next(), 1000 * retryCount);
              });
            }
          }
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const endTime = performance.now();
        const latency = endTime - startTime;

        if (latency > 200) {
          console.warn(`High latency detected: ${latency.toFixed(2)}ms for ${request.url}`);
          this.reportLatency(currentRegion.name, latency);
        }

        if (error.status === 0 || error.status >= 500) {
          console.error(`Region ${currentRegion.name} appears to be down, attempting failover`);
          this.regionRoutingService.switchRegion(this.getNextHealthyRegion(currentRegion.name));
        }

        return throwError(() => error);
      })
    );
  }

  private isExternalRequest(request: HttpRequest<any>): boolean {
    return request.url.startsWith('http://') || request.url.startsWith('https://');
  }

  private buildRegionalUrl(url: string, regionEndpoint: string): string {
    if (url.startsWith('/')) {
      return `${regionEndpoint}${url}`;
    }
    return url;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextHealthyRegion(currentRegion: string): string {
    const allRegions = this.regionRoutingService.getAllRegions();
    const otherRegions = allRegions.filter(r => r.name !== currentRegion);
    
    otherRegions.sort((a, b) => a.priority - b.priority);
    
    return otherRegions.length > 0 ? otherRegions[0].name : currentRegion;
  }

  private reportLatency(region: string, latency: number): void {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const data = JSON.stringify({
        metric: 'api_latency',
        region,
        latency,
        timestamp: new Date().toISOString()
      });
      
      navigator.sendBeacon('/api/metrics/latency', data);
    }
  }
}
