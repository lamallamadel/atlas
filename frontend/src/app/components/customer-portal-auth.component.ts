import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-customer-portal-auth',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Vérification de votre accès...</p>
        </div>

        <div *ngIf="!loading && error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Accès refusé</h2>
          <p>{{ error }}</p>
          <p class="help-text">
            Veuillez contacter votre agent immobilier pour obtenir un nouveau lien d'accès.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    .loading-state {
      padding: 24px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #666;
      font-size: 16px;
    }

    .error-state {
      padding: 24px;
    }

    .error-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .error-state h2 {
      color: #333;
      margin-bottom: 12px;
      font-size: 24px;
    }

    .error-state p {
      color: #666;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .help-text {
      margin-top: 24px;
      font-size: 14px;
      color: #999;
    }
  `]
})
export class CustomerPortalAuthComponent implements OnInit {
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portalService: CustomerPortalService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        this.validateToken(token);
      } else {
        this.error = 'Aucun token fourni';
        this.loading = false;
      }
    });
  }

  validateToken(token: string): void {
    this.portalService.validateToken(token).subscribe({
      next: (response) => {
        if (response.valid) {
          this.router.navigate(['/customer-portal/dashboard']);
        } else {
          this.error = 'Token invalide ou expiré';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Token validation error:', err);
        this.error = 'Erreur lors de la validation du token';
        this.loading = false;
      }
    });
  }
}
