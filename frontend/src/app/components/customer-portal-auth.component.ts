import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-customer-portal-auth',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        @if (loading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Vérification de votre accès...</p>
          </div>
        }
    
        @if (!loading && error) {
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h2>Accès refusé</h2>
            <p>{{ error }}</p>
            <p class="help-text">
              Veuillez contacter votre agent immobilier pour obtenir un nouveau lien d'accès.
            </p>
          </div>
        }
      </div>
    </div>
    `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--ds-marine) 0%, var(--ds-primary) 55%, var(--ds-marine-light) 100%);
    }

    .auth-card {
      background: var(--ds-surface);
      border-radius: var(--ds-radius-lg);
      padding: var(--ds-space-12);
      box-shadow: var(--ds-shadow-xl);
      border: 1px solid var(--ds-divider);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    .loading-state {
      padding: var(--ds-space-6);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--ds-surface-offset);
      border-top: 4px solid var(--ds-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--ds-space-6);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      color: var(--ds-text-muted);
      font-size: 16px;
    }

    .error-state {
      padding: var(--ds-space-6);
    }

    .error-icon {
      font-size: 64px;
      margin-bottom: var(--ds-space-4);
    }

    .error-state h2 {
      color: var(--ds-text);
      margin-bottom: var(--ds-space-3);
      font-size: 24px;
    }

    .error-state p {
      color: var(--ds-text-muted);
      margin-bottom: var(--ds-space-2);
      font-size: 16px;
    }

    .help-text {
      margin-top: var(--ds-space-6);
      font-size: 14px;
      color: var(--ds-text-faint);
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
