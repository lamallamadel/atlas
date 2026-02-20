import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpCacheService } from '../services/http-cache.service';

/**
 * Cache GET requests for 60 seconds to improve performance.
 * Skips caching if URL contains 'no-cache'.
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {

    // Endpoints known to be safely cacheable
    private cacheableEndpoints = [
        '/api/v1/kpi',
        '/api/v1/users',
        '/api/v1/partie-prenante-roles',
        '/api/v1/cities' // example lookup endpoints
    ];

    constructor(private cacheService: HttpCacheService) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        // Only cache GET requests
        if (request.method !== 'GET') {
            // Invalidate cache safely if it's a mutation (e.g POST/PUT/DELETE)
            // This could be made smarter depending on the endpoint
            return next.handle(request);
        }

        // Check if the request should be cached
        const isCacheable = this.cacheableEndpoints.some(endpoint => request.url.includes(endpoint));
        if (!isCacheable || request.headers.has('X-No-Cache')) {
            return next.handle(request);
        }

        // Try to get from cache
        const cachedResponse = this.cacheService.get(request.urlWithParams);
        if (cachedResponse) {
            // Returns a cached response
            return of(cachedResponse);
        }

        // If not in cache, send the request and cache the response
        return next.handle(request).pipe(
            tap(event => {
                if (event instanceof HttpResponse && event.status === 200) {
                    // Cache for 60 seconds (60000ms)
                    this.cacheService.put(request.urlWithParams, event, 60000);
                }
            })
        );
    }
}
