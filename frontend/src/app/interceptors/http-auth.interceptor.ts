import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  private readonly ORG_ID_KEY = 'org_id';
  private readonly DEFAULT_ORG_ID = 'ORG-001';

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const token = this.authService.getToken();
    const orgId = localStorage.getItem(this.ORG_ID_KEY);

    const headers: { [key: string]: string } = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;

      // Tenant header is mandatory for backend calls. If the user did not select one yet,
      // keep a deterministic default to avoid 400 Bad Request on endpoints like /ping.
      if (!orgId) {
        headers['X-Org-Id'] = this.DEFAULT_ORG_ID;
      }
    }

    if (orgId) {
      headers['X-Org-Id'] = orgId;
    }

    if (Object.keys(headers).length > 0) {
      const modifiedReq = req.clone({ setHeaders: headers });
      return next.handle(modifiedReq);
    }

    return next.handle(req);
  }
}
