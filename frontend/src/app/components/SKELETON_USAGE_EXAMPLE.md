# Exemples d'utilisation - Skeleton Screens & Performance

## Exemple complet: Liste de dossiers avec skeleton

### Component TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { DossierApiService, DossierResponse } from '../services/dossier-api.service';

@Component({
  selector: 'app-dossiers-optimized',
  templateUrl: './dossiers-optimized.component.html',
  styleUrls: ['./dossiers-optimized.component.css']
})
export class DossiersOptimizedComponent implements OnInit {
  dossiers: DossierResponse[] = [];
  loading = false;
  page = 0;
  pageSize = 20;
  hasMore = true;
  
  constructor(private dossierApiService: DossierApiService) {}
  
  ngOnInit(): void {
    this.loadDossiers();
  }
  
  loadDossiers(): void {
    this.loading = true;
    this.dossierApiService.list({ page: this.page, size: this.pageSize })
      .subscribe({
        next: (response) => {
          this.dossiers = [...this.dossiers, ...response.content];
          this.hasMore = !response.last;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }
  
  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.page++;
    this.loadDossiers();
  }
  
  trackByDossier(index: number, dossier: DossierResponse): number {
    return dossier.id;
  }
}
```

### Template HTML

```html
<!-- Skeleton pendant le chargement initial -->
<app-loading-skeleton 
  *ngIf="loading && dossiers.length === 0" 
  variant="card" 
  [rows]="5"
  [animate]="true">
</app-loading-skeleton>

<!-- Liste avec infinite scroll -->
<div 
  *ngIf="dossiers.length > 0"
  class="dossiers-container"
  appInfiniteScroll
  [scrollThreshold]="0.8"
  (scrolled)="loadMore()">
  
  <mat-card 
    *ngFor="let dossier of dossiers; trackBy: trackByDossier"
    class="dossier-card">
    <mat-card-header>
      <div mat-card-avatar class="dossier-avatar">
        <img 
          [appLazyLoadImage]="dossier.annonceImageUrl"
          [placeholder]="'assets/placeholder-avatar.svg'"
          alt="Photo annonce">
      </div>
      <mat-card-title>{{ dossier.leadName }}</mat-card-title>
      <mat-card-subtitle>{{ dossier.annonceTitle }}</mat-card-subtitle>
    </mat-card-header>
    
    <mat-card-content>
      <p><strong>Téléphone:</strong> {{ dossier.leadPhone }}</p>
      <p><strong>Statut:</strong> {{ dossier.status }}</p>
    </mat-card-content>
  </mat-card>
  
  <!-- Skeleton pendant le chargement de plus de résultats -->
  <app-loading-skeleton 
    *ngIf="loading && dossiers.length > 0" 
    variant="card" 
    [rows]="3">
  </app-loading-skeleton>
</div>
```

## Exemple: Galerie d'annonces avec virtual scroll

### Component TypeScript

```typescript
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AnnonceApiService, AnnonceResponse } from '../services/annonce-api.service';

@Component({
  selector: 'app-annonces-gallery',
  templateUrl: './annonces-gallery.component.html'
})
export class AnnoncesGalleryComponent implements OnInit {
  @ViewChild('annonceTemplate', { static: true }) annonceTemplate!: TemplateRef<any>;
  
  annonces: AnnonceResponse[] = [];
  loading = false;
  
  constructor(private annonceApiService: AnnonceApiService) {}
  
  ngOnInit(): void {
    this.loadAnnonces();
  }
  
  loadAnnonces(): void {
    this.loading = true;
    this.annonceApiService.list({ page: 0, size: 1000 })
      .subscribe({
        next: (response) => {
          this.annonces = response.content;
          this.loading = false;
        }
      });
  }
  
  onAnnonceClick(annonce: AnnonceResponse): void {
    console.log('Clicked:', annonce);
  }
}
```

### Template HTML

```html
<div class="gallery-container">
  <!-- Skeleton pendant le chargement -->
  <app-loading-skeleton 
    *ngIf="loading" 
    variant="grid" 
    [rows]="12">
  </app-loading-skeleton>
  
  <!-- Virtual scroll pour grande liste -->
  <app-virtual-scroll-list
    *ngIf="!loading"
    [items]="annonces"
    [itemHeight]="320"
    [itemTemplate]="annonceTemplate"
    (itemClick)="onAnnonceClick($event)">
  </app-virtual-scroll-list>
  
  <!-- Template d'item -->
  <ng-template #annonceTemplate let-annonce>
    <mat-card class="annonce-card">
      <img 
        mat-card-image 
        [appLazyLoadImage]="annonce.photoUrls[0]"
        [blurUpPlaceholder]="annonce.thumbnailUrl"
        [placeholder]="'assets/placeholder-property.svg'"
        alt="{{ annonce.title }}">
      
      <mat-card-content>
        <h3>{{ annonce.title }}</h3>
        <p class="price">{{ annonce.price | currency:'EUR' }}</p>
        <p class="location">{{ annonce.city }}</p>
      </mat-card-content>
    </mat-card>
  </ng-template>
</div>
```

## Exemple: Détail avec skeleton et lazy images

### Component TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DossierApiService, DossierDetailResponse } from '../services/dossier-api.service';

@Component({
  selector: 'app-dossier-detail-optimized',
  templateUrl: './dossier-detail-optimized.component.html'
})
export class DossierDetailOptimizedComponent implements OnInit {
  dossier?: DossierDetailResponse;
  loading = false;
  
  constructor(
    private route: ActivatedRoute,
    private dossierApiService: DossierApiService
  ) {}
  
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDossier(id);
  }
  
  loadDossier(id: number): void {
    this.loading = true;
    this.dossierApiService.getById(id).subscribe({
      next: (data) => {
        this.dossier = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
```

### Template HTML

```html
<div class="detail-container">
  <!-- Skeleton pendant le chargement -->
  <app-loading-skeleton 
    *ngIf="loading" 
    variant="detail" 
    [rows]="8">
  </app-loading-skeleton>
  
  <!-- Contenu réel -->
  <div *ngIf="!loading && dossier" class="dossier-detail">
    <div class="detail-header">
      <button mat-icon-button routerLink="/dossiers">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ dossier.leadName }}</h1>
      <span class="status-badge">{{ dossier.status }}</span>
    </div>
    
    <mat-card class="detail-card">
      <div class="detail-section">
        <h2>Informations générales</h2>
        <div class="detail-row">
          <span class="label">Nom:</span>
          <span class="value">{{ dossier.leadName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Téléphone:</span>
          <span class="value">{{ dossier.leadPhone }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">{{ dossier.leadEmail }}</span>
        </div>
      </div>
      
      <!-- Photos avec lazy loading -->
      <div class="detail-section" *ngIf="dossier.annonce?.photoUrls">
        <h2>Photos de l'annonce</h2>
        <div class="photo-grid">
          <img 
            *ngFor="let photoUrl of dossier.annonce.photoUrls"
            [appLazyLoadImage]="photoUrl"
            [placeholder]="'assets/placeholder-photo.svg'"
            class="property-photo"
            alt="Photo du bien">
        </div>
      </div>
    </mat-card>
  </div>
</div>
```

## Exemple: Timeline avec skeleton

### Template HTML

```html
<div class="timeline-container">
  <!-- Skeleton timeline -->
  <app-loading-skeleton 
    *ngIf="loadingActivities" 
    variant="timeline" 
    [rows]="5">
  </app-loading-skeleton>
  
  <!-- Timeline réelle -->
  <div *ngIf="!loadingActivities" class="activity-timeline">
    <div 
      *ngFor="let activity of activities" 
      class="timeline-item"
      appInfiniteScroll
      (scrolled)="loadMoreActivities()">
      <div class="timeline-marker">
        <mat-icon>{{ activity.icon }}</mat-icon>
      </div>
      <mat-card class="timeline-content">
        <h3>{{ activity.title }}</h3>
        <p>{{ activity.description }}</p>
        <span class="timestamp">{{ activity.createdAt | date:'short' }}</span>
      </mat-card>
    </div>
  </div>
</div>
```

## Exemple: Messages avec skeleton

### Template HTML

```html
<div class="messages-container">
  <!-- Skeleton messages -->
  <app-loading-skeleton 
    *ngIf="loadingMessages" 
    variant="message" 
    [rows]="8">
  </app-loading-skeleton>
  
  <!-- Messages réels -->
  <div 
    *ngIf="!loadingMessages"
    class="messages-list"
    appInfiniteScroll
    [scrollThreshold]="0.9"
    (scrolled)="loadOlderMessages()">
    
    <div 
      *ngFor="let message of messages"
      [ngClass]="{
        'message-item': true,
        'message-sent': message.direction === 'OUTBOUND',
        'message-received': message.direction === 'INBOUND'
      }">
      <div class="message-avatar">
        <img 
          [appLazyLoadImage]="message.senderAvatar"
          [placeholder]="'assets/avatar-placeholder.svg'"
          alt="Avatar">
      </div>
      <div class="message-bubble">
        <p>{{ message.content }}</p>
        <span class="message-time">{{ message.sentAt | date:'short' }}</span>
      </div>
    </div>
    
    <!-- Loader pour chargement de plus -->
    <app-loading-skeleton 
      *ngIf="loadingMore" 
      variant="message" 
      [rows]="3">
    </app-loading-skeleton>
  </div>
</div>
```

## Exemple: Dashboard avec KPI skeletons

### Template HTML

```html
<div class="dashboard">
  <div class="kpi-grid">
    <!-- Skeletons KPI -->
    <ng-container *ngIf="loadingKpis">
      <app-loading-skeleton 
        *ngFor="let i of [1,2,3,4]"
        variant="dashboard-kpi">
      </app-loading-skeleton>
    </ng-container>
    
    <!-- KPIs réels -->
    <mat-card *ngFor="let kpi of kpis" class="kpi-card">
      <mat-card-header>
        <mat-card-title>{{ kpi.title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-change" [class.positive]="kpi.change > 0">
          {{ kpi.change > 0 ? '+' : '' }}{{ kpi.change }}%
        </div>
      </mat-card-content>
    </mat-card>
  </div>
</div>
```

## Exemple: Formulaire avec skeleton

### Template HTML

```html
<div class="form-container">
  <!-- Skeleton formulaire -->
  <app-loading-skeleton 
    *ngIf="loadingForm" 
    variant="form" 
    [rows]="6">
  </app-loading-skeleton>
  
  <!-- Formulaire réel -->
  <form *ngIf="!loadingForm" [formGroup]="dossierForm" (ngSubmit)="onSubmit()">
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline">
          <mat-label>Nom du prospect</mat-label>
          <input matInput formControlName="leadName">
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Téléphone</mat-label>
          <input matInput formControlName="leadPhone">
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="leadEmail">
        </mat-form-field>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" type="submit">
          Enregistrer
        </button>
        <button mat-button type="button" routerLink="/dossiers">
          Annuler
        </button>
      </mat-card-actions>
    </mat-card>
  </form>
</div>
```

## Exemple: Prefetch manuel au survol

### Component TypeScript

```typescript
import { Component } from '@angular/core';
import { PrefetchService } from '../services/prefetch.service';

@Component({
  selector: 'app-navigation-menu',
  template: `
    <nav>
      <a 
        routerLink="/dossiers" 
        (mouseenter)="prefetchDossiers()">
        Dossiers
      </a>
      <a 
        routerLink="/annonces" 
        (mouseenter)="prefetchAnnonces()">
        Annonces
      </a>
    </nav>
  `
})
export class NavigationMenuComponent {
  constructor(private prefetchService: PrefetchService) {}
  
  prefetchDossiers(): void {
    this.prefetchService.manualPrefetch('/dossiers');
  }
  
  prefetchAnnonces(): void {
    this.prefetchService.manualPrefetch('/annonces');
  }
}
```

## Styles CSS communs

```css
/* Conteneur avec infinite scroll */
.scrollable-container {
  height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Grille responsive pour galeries */
.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* Cards avec images lazy-loaded */
.annonce-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

/* Timeline */
.activity-timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

/* Messages */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.message-sent {
  flex-direction: row-reverse;
}

.message-bubble {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 12px;
  max-width: 70%;
}

.message-sent .message-bubble {
  background: #e3f2fd;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-value {
  font-size: 48px;
  font-weight: bold;
  margin: 20px 0;
}

.kpi-change {
  color: #f44336;
}

.kpi-change.positive {
  color: #4caf50;
}
```

## Points clés à retenir

1. **Toujours matcher le skeleton au contenu final** pour éviter les layout shifts
2. **Utiliser lazy loading pour toutes les images** dans les listes et grilles
3. **Implémenter virtual scroll** pour les listes > 100 items
4. **Combiner infinite scroll avec skeleton** pour une UX fluide
5. **Prefetch au survol** des liens pour améliorer la navigation perçue
6. **Adapter le nombre de skeleton rows** au pageSize de l'API
7. **Utiliser trackBy** dans les ngFor pour optimiser les rendus
8. **Tester sur mobile et desktop** pour valider les performances
