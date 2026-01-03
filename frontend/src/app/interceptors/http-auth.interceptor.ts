import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  private readonly ORG_ID_KEY = 'org_id';

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const token = this.authService.getToken();
    const orgId = localStorage.getItem(this.ORG_ID_KEY);

    const headers: { [key: string]: string } = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
