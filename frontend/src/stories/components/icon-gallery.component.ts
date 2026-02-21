import { Component, OnInit } from '@angular/core';
import { IconRegistryService, IconMetadata } from '../../app/services/icon-registry.service';

@Component({
  selector: 'app-icon-gallery',
  template: `
    <div class="icon-gallery">
      <div class="gallery-header">
        <h2>Real Estate Icon Library</h2>
        <p>30+ icônes métier immobilier en SVG 24x24px, style outline 2px cohérent avec Material Icons</p>
      </div>

      <div class="gallery-controls">
        <input 
          type="text" 
          placeholder="Rechercher une icône..." 
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          class="search-input">
        
        <div class="category-filters">
          <button 
            *ngFor="let cat of categories"
            [class.active]="selectedCategory === cat.key"
            (click)="filterByCategory(cat.key)"
            class="category-btn">
            {{ cat.label }}
          </button>
          <button 
            [class.active]="selectedCategory === null"
            (click)="clearFilter()"
            class="category-btn">
            Tous
          </button>
        </div>
      </div>

      <div class="icon-grid">
        <div *ngFor="let icon of filteredIcons" class="icon-card">
          <div class="icon-display">
            <app-re-icon [icon]="icon.id" size="large"></app-re-icon>
          </div>
          <div class="icon-info">
            <div class="icon-name">{{ icon.name }}</div>
            <div class="icon-id">{{ icon.id }}</div>
            <div class="icon-tags">
              <span *ngFor="let tag of icon.tags.slice(0, 3)" class="tag">{{ tag }}</span>
            </div>
          </div>
          <button class="copy-btn" (click)="copyToClipboard(icon.id)">
            {{ copiedIcon === icon.id ? '✓ Copié' : 'Copier' }}
          </button>
        </div>
      </div>

      <div *ngIf="filteredIcons.length === 0" class="no-results">
        Aucune icône trouvée pour "{{ searchQuery }}"
      </div>
    </div>
  `,
  styles: [`
    .icon-gallery {
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .gallery-header {
      margin-bottom: 32px;
    }

    .gallery-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .gallery-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .gallery-controls {
      margin-bottom: 32px;
    }

    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 12px 16px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .search-input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .category-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .category-btn {
      padding: 8px 16px;
      font-size: 13px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-btn:hover {
      border-color: #1976d2;
      color: #1976d2;
    }

    .category-btn.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .icon-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .icon-card:hover {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .icon-display {
      margin-bottom: 12px;
      color: #333;
    }

    .icon-info {
      flex: 1;
      margin-bottom: 12px;
    }

    .icon-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .icon-id {
      font-size: 12px;
      color: #666;
      font-family: 'Courier New', monospace;
      margin-bottom: 8px;
    }

    .icon-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .tag {
      font-size: 11px;
      padding: 2px 6px;
      background: #f0f0f0;
      border-radius: 4px;
      color: #666;
    }

    .copy-btn {
      width: 100%;
      padding: 6px 12px;
      font-size: 12px;
      border: 1px solid #1976d2;
      border-radius: 4px;
      background: white;
      color: #1976d2;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #1976d2;
      color: white;
    }

    .no-results {
      text-align: center;
      padding: 48px;
      color: #666;
    }
  `]
})
export class IconGalleryComponent implements OnInit {
  searchQuery = '';
  selectedCategory: IconMetadata['category'] | null = null;
  allIcons: IconMetadata[] = [];
  filteredIcons: IconMetadata[] = [];
  categories: Array<{ key: IconMetadata['category']; label: string }> = [];
  copiedIcon: string | null = null;

  constructor(private iconRegistry: IconRegistryService) {}

  ngOnInit(): void {
    this.iconRegistry.loadIcons().subscribe();
    this.allIcons = this.iconRegistry.getMetadata();
    this.filteredIcons = this.allIcons;
    this.categories = this.iconRegistry.getAllCategories();
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredIcons = this.selectedCategory 
        ? this.iconRegistry.getIconsByCategory(this.selectedCategory)
        : this.allIcons;
    } else {
      this.filteredIcons = this.iconRegistry.searchIcons(this.searchQuery);
      if (this.selectedCategory) {
        this.filteredIcons = this.filteredIcons.filter(icon => icon.category === this.selectedCategory);
      }
    }
  }

  filterByCategory(category: IconMetadata['category']): void {
    this.selectedCategory = category;
    this.filteredIcons = this.iconRegistry.getIconsByCategory(category);
    if (this.searchQuery.trim()) {
      this.filteredIcons = this.filteredIcons.filter(icon =>
        icon.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        icon.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
      );
    }
  }

  clearFilter(): void {
    this.selectedCategory = null;
    this.searchQuery = '';
    this.filteredIcons = this.allIcons;
  }

  copyToClipboard(iconId: string): void {
    const code = `<app-re-icon icon="${iconId}"></app-re-icon>`;
    navigator.clipboard.writeText(code).then(() => {
      this.copiedIcon = iconId;
      setTimeout(() => this.copiedIcon = null, 2000);
    });
  }
}
