import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalHits: number;
  elasticsearchAvailable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {
  private apiUrl = `${environment.apiBaseUrl}/v1/search`;

  constructor(private http: HttpClient) {}

  search(query?: string, type?: string, filters?: any, page = 0, size = 10): Observable<SearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query) {
      params = params.set('q', query);
    }

    if (type) {
      params = params.set('type', type);
    }

    if (filters && Object.keys(filters).length > 0) {
      params = params.set('filters', JSON.stringify(filters));
    }

    return this.http.get<SearchResponse>(this.apiUrl, { params });
  }

  autocomplete(query: string, type?: string): Observable<SearchResponse> {
    let params = new HttpParams().set('q', query);

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<SearchResponse>(`${this.apiUrl}/autocomplete`, { params });
  }
}
