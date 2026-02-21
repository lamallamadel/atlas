# Badge Component - Real-World Usage Examples

## Property Listing Card

```html
<mat-card class="property-card">
  <mat-card-header>
    <mat-card-title>
      Villa Moderne - Paris 16ème
      <app-badge 
        variant="soft" 
        color="success-sold" 
        size="md"
        icon="sell">
        Vendu
      </app-badge>
    </mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    <div class="property-details">
      <p>3 chambres • 150m² • Jardin</p>
      <p class="price">1 250 000 €</p>
    </div>
    
    <div class="property-tags">
      <app-badge 
        variant="soft" 
        color="primary" 
        size="sm"
        [pill]="true"
        icon="star">
        Premium
      </app-badge>
      
      <app-badge 
        variant="outline" 
        color="neutral-warmth" 
        size="sm"
        [pill]="true">
        Vente
      </app-badge>
      
      <app-badge 
        variant="soft" 
        color="info" 
        size="sm"
        [pill]="true"
        icon="verified">
        Vérifié
      </app-badge>
    </div>
  </mat-card-content>
</mat-card>
```

## Lead Management Dashboard

```html
<div class="lead-card">
  <div class="lead-header">
    <div class="lead-info">
      <h3>Jean Dupont</h3>
      <span class="lead-email">jean.dupont@example.com</span>
    </div>
    
    <div class="lead-status">
      <app-badge 
        variant="solid" 
        color="warning-critical"
        icon="warning"
        [pulse]="true"
        ariaLabel="Dossier urgent nécessitant une action immédiate">
        Urgent
      </app-badge>
    </div>
  </div>
  
  <div class="lead-details">
    <p>Intéressé par: Appartement T3, Paris 15ème</p>
    <p>Budget: 400 000 - 500 000 €</p>
  </div>
  
  <div class="lead-meta">
    <app-badge 
      variant="soft" 
      color="info" 
      size="sm"
      [dot]="true">
      Nouveau contact
    </app-badge>
    
    <app-badge 
      variant="soft" 
      color="success" 
      size="sm"
      icon="phone">
      À rappeler
    </app-badge>
    
    <app-badge 
      variant="soft" 
      color="warning-attention" 
      size="sm"
      icon="schedule">
      Suivi en cours
    </app-badge>
  </div>
  
  <div class="lead-timeline">
    <span class="timeline-date">Créé le 15/01/2024 à 14:30</span>
    <span class="timeline-separator">•</span>
    <span class="timeline-update">Mis à jour il y a 2h</span>
  </div>
</div>
```

## Notification Center

```html
<div class="notification-center">
  <div class="notification-header">
    <h2>Notifications</h2>
    <app-badge 
      variant="solid" 
      color="danger" 
      size="sm"
      [pill]="true"
      [pulse]="true"
      ariaLabel="8 notifications non lues">
      8
    </app-badge>
  </div>
  
  <div class="notification-list">
    <div class="notification-item">
      <mat-icon>message</mat-icon>
      <div class="notification-content">
        <strong>Nouveaux messages</strong>
        <span>Vous avez 3 nouveaux messages de clients</span>
      </div>
      <app-badge 
        variant="solid" 
        color="danger" 
        size="sm"
        [pill]="true">
        3
      </app-badge>
    </div>
    
    <div class="notification-item">
      <mat-icon>event</mat-icon>
      <div class="notification-content">
        <strong>Rendez-vous à venir</strong>
        <span>2 rendez-vous programmés aujourd'hui</span>
      </div>
      <app-badge 
        variant="soft" 
        color="warning-attention" 
        size="sm"
        [pill]="true">
        2
      </app-badge>
    </div>
    
    <div class="notification-item">
      <mat-icon>task</mat-icon>
      <div class="notification-content">
        <strong>Tâches en attente</strong>
        <span>5 tâches nécessitent votre attention</span>
      </div>
      <app-badge 
        variant="soft" 
        color="info" 
        size="sm"
        [pill]="true">
        5
      </app-badge>
    </div>
  </div>
</div>
```

## Dossier Timeline

```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-marker">
      <mat-icon>add_circle</mat-icon>
    </div>
    <div class="timeline-content">
      <div class="timeline-header">
        <strong>Dossier créé</strong>
        <app-badge 
          variant="soft" 
          color="info" 
          size="sm"
          icon="fiber_new"
          [pulse]="true">
          Nouveau
        </app-badge>
      </div>
      <p>Le dossier a été créé par Marie Martin</p>
      <span class="timeline-date">Il y a 2 heures</span>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-marker">
      <mat-icon>phone</mat-icon>
    </div>
    <div class="timeline-content">
      <div class="timeline-header">
        <strong>Appel téléphonique</strong>
        <app-badge 
          variant="soft" 
          color="success" 
          size="sm"
          icon="check">
          Complété
        </app-badge>
      </div>
      <p>Appel de qualification avec le client</p>
      <span class="timeline-date">Il y a 1 heure</span>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-marker">
      <mat-icon>event</mat-icon>
    </div>
    <div class="timeline-content">
      <div class="timeline-header">
        <strong>Rendez-vous planifié</strong>
        <app-badge 
          variant="solid" 
          color="warning-urgent" 
          size="sm"
          icon="warning"
          [pulse]="true">
          Aujourd'hui
        </app-badge>
      </div>
      <p>Visite du bien prévu à 15:00</p>
      <span class="timeline-date">Dans 3 heures</span>
    </div>
  </div>
</div>
```

## Data Table with Status Column

```html
<table mat-table [dataSource]="properties">
  <ng-container matColumnDef="title">
    <th mat-header-cell *matHeaderCellDef>Titre</th>
    <td mat-cell *matCellDef="let property">{{ property.title }}</td>
  </ng-container>
  
  <ng-container matColumnDef="status">
    <th mat-header-cell *matHeaderCellDef>Statut</th>
    <td mat-cell *matCellDef="let property">
      <app-badge 
        *ngIf="property.status === 'SOLD'"
        variant="soft" 
        color="success-sold" 
        icon="sell">
        Vendu
      </app-badge>
      
      <app-badge 
        *ngIf="property.status === 'RENTED'"
        variant="soft" 
        color="success-rented" 
        icon="key">
        Loué
      </app-badge>
      
      <app-badge 
        *ngIf="property.status === 'AVAILABLE'"
        variant="soft" 
        color="success" 
        icon="home">
        Disponible
      </app-badge>
      
      <app-badge 
        *ngIf="property.status === 'PENDING'"
        variant="soft" 
        color="warning-attention" 
        icon="pending">
        En attente
      </app-badge>
    </td>
  </ng-container>
  
  <ng-container matColumnDef="type">
    <th mat-header-cell *matHeaderCellDef>Type</th>
    <td mat-cell *matCellDef="let property">
      <app-badge 
        variant="outline" 
        color="neutral-warmth" 
        size="sm"
        [pill]="true">
        {{ property.type }}
      </app-badge>
    </td>
  </ng-container>
  
  <ng-container matColumnDef="features">
    <th mat-header-cell *matHeaderCellDef>Caractéristiques</th>
    <td mat-cell *matCellDef="let property">
      <div class="features-badges">
        <app-badge 
          *ngIf="property.isPremium"
          variant="soft" 
          color="primary" 
          size="sm"
          [pill]="true"
          icon="star">
          Premium
        </app-badge>
        
        <app-badge 
          *ngIf="property.isVerified"
          variant="soft" 
          color="success" 
          size="sm"
          [pill]="true"
          icon="verified">
          Vérifié
        </app-badge>
        
        <app-badge 
          *ngIf="property.isNew"
          variant="soft" 
          color="info" 
          size="sm"
          [pill]="true"
          [dot]="true"
          [pulse]="true">
          Nouveau
        </app-badge>
      </div>
    </td>
  </ng-container>
  
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
```

## User Profile with Status

```html
<div class="user-profile">
  <div class="profile-header">
    <img [src]="user.avatar" alt="Avatar" class="avatar">
    <div class="profile-info">
      <h2>{{ user.name }}</h2>
      <p>{{ user.role }}</p>
      
      <div class="profile-badges">
        <app-badge 
          variant="soft" 
          color="success" 
          size="sm"
          [dot]="true"
          [pulse]="true"
          ariaLabel="Utilisateur en ligne">
          En ligne
        </app-badge>
        
        <app-badge 
          variant="soft" 
          color="primary" 
          size="sm"
          icon="verified"
          [pill]="true">
          Vérifié
        </app-badge>
        
        <app-badge 
          *ngIf="user.isPremium"
          variant="solid" 
          color="warning-attention" 
          size="sm"
          icon="star"
          [pill]="true">
          Premium
        </app-badge>
      </div>
    </div>
  </div>
</div>
```

## Filter Chips with Badges

```html
<div class="filter-bar">
  <h3>Filtres actifs</h3>
  
  <div class="filter-chips">
    <mat-chip-listbox>
      <mat-chip>
        Type: Appartement
        <app-badge 
          variant="soft" 
          color="neutral" 
          size="sm"
          [pill]="true">
          45
        </app-badge>
      </mat-chip>
      
      <mat-chip>
        Prix: 300k - 500k
        <app-badge 
          variant="soft" 
          color="info" 
          size="sm"
          [pill]="true">
          12
        </app-badge>
      </mat-chip>
      
      <mat-chip>
        Statut: Disponible
        <app-badge 
          variant="soft" 
          color="success" 
          size="sm"
          [pill]="true"
          icon="check">
          28
        </app-badge>
      </mat-chip>
      
      <mat-chip>
        Urgent uniquement
        <app-badge 
          variant="solid" 
          color="warning-critical" 
          size="sm"
          [pill]="true"
          [pulse]="true">
          3
        </app-badge>
      </mat-chip>
    </mat-chip-listbox>
  </div>
</div>
```

## Sidebar Navigation with Counts

```html
<mat-sidenav>
  <mat-nav-list>
    <a mat-list-item routerLink="/dashboard">
      <mat-icon>dashboard</mat-icon>
      <span>Tableau de bord</span>
    </a>
    
    <a mat-list-item routerLink="/properties">
      <mat-icon>home</mat-icon>
      <span>Propriétés</span>
      <app-badge 
        variant="soft" 
        color="neutral" 
        size="sm"
        [pill]="true">
        {{ propertyCount }}
      </app-badge>
    </a>
    
    <a mat-list-item routerLink="/leads">
      <mat-icon>people</mat-icon>
      <span>Leads</span>
      <app-badge 
        variant="solid" 
        color="danger" 
        size="sm"
        [pill]="true"
        [pulse]="true"
        *ngIf="urgentLeadsCount > 0">
        {{ urgentLeadsCount }}
      </app-badge>
    </a>
    
    <a mat-list-item routerLink="/messages">
      <mat-icon>message</mat-icon>
      <span>Messages</span>
      <app-badge 
        variant="solid" 
        color="danger" 
        size="sm"
        [pill]="true"
        *ngIf="unreadMessagesCount > 0">
        {{ unreadMessagesCount }}
      </app-badge>
    </a>
    
    <a mat-list-item routerLink="/appointments">
      <mat-icon>event</mat-icon>
      <span>Rendez-vous</span>
      <app-badge 
        variant="soft" 
        color="warning-attention" 
        size="sm"
        [pill]="true"
        *ngIf="todayAppointmentsCount > 0">
        {{ todayAppointmentsCount }}
      </app-badge>
    </a>
  </mat-nav-list>
</mat-sidenav>
```

## Document List with Type Badges

```html
<div class="document-list">
  <div class="document-item" *ngFor="let doc of documents">
    <mat-icon [ngSwitch]="doc.type">
      <ng-container *ngSwitchCase="'pdf'">picture_as_pdf</ng-container>
      <ng-container *ngSwitchCase="'image'">image</ng-container>
      <ng-container *ngSwitchCase="'doc'">description</ng-container>
    </mat-icon>
    
    <div class="document-info">
      <strong>{{ doc.name }}</strong>
      <span class="document-meta">{{ doc.size }} • {{ doc.date | date }}</span>
    </div>
    
    <div class="document-badges">
      <app-badge 
        variant="outline" 
        color="neutral-warmth" 
        size="sm"
        [pill]="true">
        {{ doc.type | uppercase }}
      </app-badge>
      
      <app-badge 
        *ngIf="doc.isRequired"
        variant="solid" 
        color="warning-urgent" 
        size="sm"
        icon="warning"
        [pill]="true">
        Requis
      </app-badge>
      
      <app-badge 
        *ngIf="doc.isVerified"
        variant="soft" 
        color="success" 
        size="sm"
        icon="verified"
        [pill]="true">
        Vérifié
      </app-badge>
      
      <app-badge 
        *ngIf="doc.isNew"
        variant="soft" 
        color="info" 
        size="sm"
        [dot]="true"
        [pulse]="true">
        Nouveau
      </app-badge>
    </div>
  </div>
</div>
```

## TypeScript Component Example

```typescript
import { Component } from '@angular/core';
import { 
  PropertyStatus, 
  getPropertyStatusBadge,
  createNotificationBadge,
  createOnlineStatusBadge 
} from './badge.types';

@Component({
  selector: 'app-property-dashboard',
  templateUrl: './property-dashboard.component.html'
})
export class PropertyDashboardComponent {
  properties = [
    { id: 1, title: 'Villa Paris 16', status: 'SOLD' as PropertyStatus },
    { id: 2, title: 'Appartement Lyon', status: 'AVAILABLE' as PropertyStatus },
    { id: 3, title: 'Maison Bordeaux', status: 'RESERVED' as PropertyStatus }
  ];
  
  unreadCount = 5;
  isUserOnline = true;
  
  getPropertyBadge(status: PropertyStatus) {
    return getPropertyStatusBadge(status);
  }
  
  get notificationBadge() {
    return createNotificationBadge(this.unreadCount);
  }
  
  get onlineStatusBadge() {
    return createOnlineStatusBadge(this.isUserOnline);
  }
}
```

```html
<!-- property-dashboard.component.html -->
<div class="property-list">
  <div *ngFor="let property of properties" class="property-item">
    <h3>{{ property.title }}</h3>
    <app-badge 
      variant="soft"
      [color]="getPropertyBadge(property.status).color"
      [icon]="getPropertyBadge(property.status).icon">
      {{ getPropertyBadge(property.status).label }}
    </app-badge>
  </div>
</div>

<div class="user-status">
  <app-badge 
    [variant]="onlineStatusBadge.variant"
    [color]="onlineStatusBadge.color"
    [size]="onlineStatusBadge.size"
    [dot]="onlineStatusBadge.dot"
    [pulse]="onlineStatusBadge.pulse"
    [ariaLabel]="onlineStatusBadge.ariaLabel">
    {{ isUserOnline ? 'En ligne' : 'Hors ligne' }}
  </app-badge>
</div>

<div class="notifications">
  <app-badge 
    [variant]="notificationBadge.variant"
    [color]="notificationBadge.color"
    [size]="notificationBadge.size"
    [pill]="notificationBadge.pill"
    [pulse]="notificationBadge.pulse"
    [ariaLabel]="notificationBadge.ariaLabel">
    {{ unreadCount }}
  </app-badge>
</div>
```

## Responsive Mobile Example

```html
<div class="mobile-view">
  <!-- Compact badges for mobile -->
  <div class="property-card-mobile">
    <div class="property-header">
      <h4>Villa Moderne</h4>
      <app-badge 
        variant="solid" 
        color="success-sold" 
        size="sm"
        icon="sell">
        Vendu
      </app-badge>
    </div>
    
    <div class="property-tags-mobile">
      <app-badge 
        variant="soft" 
        color="primary" 
        size="sm"
        [pill]="true">
        Premium
      </app-badge>
    </div>
  </div>
</div>

<style>
@media (max-width: 768px) {
  .property-tags-mobile {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  /* Use smaller badges on mobile */
  .property-card-mobile app-badge {
    font-size: 10px;
  }
}
</style>
```
