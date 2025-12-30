import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PongResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PingService {

  private readonly apiUrl = '/api/v1/ping';

  constructor(private http: HttpClient) { }

  ping(): Observable<PongResponse> {
    return this.http.get<PongResponse>(this.apiUrl);
  }
}
