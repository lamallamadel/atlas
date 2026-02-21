import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

export interface CacheEntry {
    response: HttpResponse<any>;
    expiry: number;
}

@Injectable({
    providedIn: 'root'
})
export class HttpCacheService {
    private cache = new Map<string, CacheEntry>();

    constructor() { }

    get(url: string): HttpResponse<any> | null {
        const entry = this.cache.get(url);
        if (!entry) {
            return null;
        }
        const isExpired = Date.now() > entry.expiry;
        if (isExpired) {
            this.cache.delete(url);
            return null;
        }
        return entry.response;
    }

    put(url: string, response: HttpResponse<any>, ttlMs: number = 60000): void {
        const entry: CacheEntry = {
            response,
            expiry: Date.now() + ttlMs
        };
        this.cache.set(url, entry);
    }

    invalidate(url: string): void {
        this.cache.delete(url);
    }

    clear(): void {
        this.cache.clear();
    }
}
