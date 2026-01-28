import { Component, Input, OnInit } from '@angular/core';
import { PropertyRecommendation } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-property-recommendation',
  template: `
    <div class="recommendations-container">
      <h2>Propriétés recommandées</h2>
      <p class="intro">Basé sur vos préférences et votre recherche</p>
      
      <div *ngIf="!recommendations || recommendations.length === 0" class="empty-state">
        <p>Aucune recommandation disponible pour le moment</p>
      </div>

      <div class="property-grid">
        <div *ngFor="let property of recommendations" class="property-card">
          <div class="property-image">
            <img [src]="property.imageUrl || 'assets/placeholder-property.jpg'" 
                 [alt]="property.title">
            <div class="property-type-badge">{{ property.type }}</div>
          </div>
          <div class="property-content">
            <h3 class="property-title">{{ property.title }}</h3>
            <div class="property-location">📍 {{ property.location }}</div>
            <div class="property-price">{{ formatPrice(property.price) }}</div>
            <div class="property-features">
              <span *ngIf="property.bedrooms">🛏️ {{ property.bedrooms }}</span>
              <span *ngIf="property.bathrooms">🚿 {{ property.bathrooms }}</span>
              <span *ngIf="property.surface">📐 {{ property.surface }}m²</span>
            </div>
            <p class="property-description">{{ truncate(property.description, 100) }}</p>
            <button class="contact-button">Contactez-nous</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recommendations-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #333;
    }

    .intro {
      color: #666;
      margin-bottom: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }

    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .property-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s;
    }

    .property-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
    }

    .property-image {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: #f0f0f0;
    }

    .property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .property-type-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(102, 126, 234, 0.9);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .property-content {
      padding: 16px;
    }

    .property-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .property-location {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .property-price {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 12px;
    }

    .property-features {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #666;
    }

    .property-features span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .property-description {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .contact-button {
      width: 100%;
      padding: 10px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .contact-button:hover {
      background: #5568d3;
    }
  `]
})
export class PropertyRecommendationComponent implements OnInit {
  @Input() dossierId!: number;
  recommendations: PropertyRecommendation[] = [];

  constructor(private portalService: CustomerPortalService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.portalService.getPropertyRecommendations(this.dossierId).subscribe({
      next: (recommendations) => {
        this.recommendations = recommendations;
      },
      error: (err) => console.error('Error loading recommendations:', err)
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  }

  truncate(text: string, length: number): string {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}
