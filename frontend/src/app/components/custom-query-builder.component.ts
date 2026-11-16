import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApiService, CustomQuery } from '../services/analytics-api.service';
import { 
  DsCardComponent, 
  DsSelectComponent, 
  DsInputComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsCheckboxComponent, 
  DsBadgeComponent, 
  DsSelectOption, 
  DsToastService,
  DsTableComponent,
  DsColumn,
  DsRowAction
} from '../design-system';

@Component({
  selector: 'app-custom-query-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DsCardComponent,
    DsSelectComponent,
    DsInputComponent,
    DsButtonComponent,
    DsIconComponent,
    DsCheckboxComponent,
    DsBadgeComponent,
    DsTableComponent,
    DsCellDirective
  ],
  template: `
    <div class="custom-query-builder ds-form-stack" style="padding: 32px; max-width: var(--ds-content-wide); margin: 0 auto;">
      <header style="margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: var(--ds-marine); font-family: var(--ds-font-display);">Constructeur de requêtes SQL</h1>
        <p style="margin: 8px 0 0; color: var(--ds-text-muted);">Créez et exécutez des requêtes personnalisées sur vos données</p>
      </header>

      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="cq-card-header" style="padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 class="cq-card-title" style="margin: 0; font-size: 18px; font-weight: 700; color: var(--ds-marine);">Requêtes enregistrées</h3>
          <ds-button variant="marine" (dsClick)="createNewQuery()">
            <ds-icon name="plus" [size]="20" style="margin-right: 8px;"></ds-icon>
            Nouvelle requête
          </ds-button>
        </div>
        
        <div class="cq-card-body" style="padding: 24px;">
          @if (!editingQuery) {
            <div class="query-list ds-form-stack">
              <div class="filter-field" style="max-width: 300px;">
                <ds-select
                  label="Filtrer par catégorie"
                  [options]="categoryOptions"
                  [(ngModel)]="selectedCategory"
                  (valueChange)="onCategoryChange()">
                </ds-select>
              </div>

              <ds-table
                [columns]="dsColumns"
                [data]="queries"
                [rowActions]="dsRowActions"
                (rowAction)="onRowAction($event)"
                emptyTitle="Aucune requête trouvée"
                emptyDescription="Créez votre première requête personnalisée pour explorer vos données.">
                
                <ng-template dsCell="isApproved" let-query>
                  <ds-badge [status]="query.isApproved ? 'active' : 'warning'" size="sm" [showDot]="false">
                    {{query.isApproved ? 'Approuvée' : 'En attente'}}
                  </ds-badge>
                </ng-template>

                <ng-template dsCell="executionCount" let-query>
                  {{query.executionCount || 0}}
                </ng-template>
              </ds-table>
            </div>
          }
    
          @if (editingQuery) {
            <div class="query-editor ds-form-stack" style="max-width: 800px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--ds-divider);">
              <ds-input label="Nom de la requête" [(ngModel)]="editingQuery.name" required="true" placeholder="ex. Liste des prospects par ville"></ds-input>
              
              <div class="ds-field">
                <label class="ds-field__label">Description</label>
                <div class="ds-field__wrap">
                  <textarea class="ds-field__input" [(ngModel)]="editingQuery.description" rows="2" style="height: auto; padding: 12px;"></textarea>
                </div>
              </div>

              <ds-select
                label="Catégorie"
                [options]="categoryOptions.slice(1)"
                [(ngModel)]="editingQuery.category">
              </ds-select>

              <div class="ds-field">
                <label class="ds-field__label">Requête SQL</label>
                <div class="ds-field__wrap">
                  <textarea class="ds-field__input sql-editor" [(ngModel)]="editingQuery.sqlQuery"
                    rows="10"
                    placeholder="SELECT * FROM dossier WHERE ..."
                    style="height: auto; padding: 12px; font-family: var(--ds-font-mono); font-size: 13px;"></textarea>
                </div>
                <p class="ds-field__hint">Seules les requêtes SELECT sont autorisées</p>
              </div>

              <ds-checkbox [(ngModel)]="editingQuery.isPublic" label="Rendre cette requête publique pour l'équipe"></ds-checkbox>

              <div class="editor-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--ds-divider);">
                <ds-button variant="ghost" size="md" (dsClick)="cancelEdit()">Annuler</ds-button>
                <ds-button variant="marine" size="md" (dsClick)="saveQuery()" [disabled]="!editingQuery.name || !editingQuery.sqlQuery">
                  Enregistrer la requête
                </ds-button>
              </div>
            </div>
          }
    
          @if (queryResults) {
            <div class="query-results ds-form-stack" style="margin-top: 48px; padding-top: 32px; border-top: 2px solid var(--ds-divider);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--ds-marine);">Résultats de la requête</h3>
                <ds-button variant="ghost" size="sm" (dsClick)="exportResults()">
                  <ds-icon name="download" [size]="16" style="margin-right: 8px;"></ds-icon>
                  Exporter en CSV
                </ds-button>
              </div>

              <ds-table
                [columns]="resultDsColumns"
                [data]="queryResults"
                [showTableHeader]="true">
              </ds-table>
            </div>
          }
        </div>
      </ds-card>
    </div>
    `
})
export class CustomQueryBuilderComponent implements OnInit {
  private analyticsService = inject(AnalyticsApiService);
  private toastService = inject(DsToastService);

  queries: CustomQuery[] = [];
  editingQuery: CustomQuery | null = null;
  selectedCategory = '';
  queryResults: any[] | null = null;
  resultDsColumns: DsColumn<any>[] = [];
  
  dsColumns: DsColumn<CustomQuery>[] = [
    { key: 'name',           header: 'Nom' },
    { key: 'category',       header: 'Catégorie' },
    { key: 'isApproved',     header: 'Statut' },
    { key: 'executionCount', header: 'Exécutions' }
  ];

  dsRowActions: DsRowAction<CustomQuery>[] = [
    { icon: 'edit',  label: 'Modifier',  action: 'edit',    ariaLabel: 'Modifier la requête' },
    { icon: 'chart', label: 'Exécuter', action: 'execute', ariaLabel: 'Exécuter la requête' },
    { icon: 'trash', label: 'Supprimer', action: 'delete',  ariaLabel: 'Supprimer la requête' }
  ];

  readonly categoryOptions: DsSelectOption[] = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'leads', label: 'Prospects' },
    { value: 'sales', label: 'Ventes' },
    { value: 'agents', label: 'Agents' },
    { value: 'properties', label: 'Biens' }
  ];

  ngOnInit(): void {
    this.loadQueries();
  }

  loadQueries(): void {
    this.analyticsService.getCustomQueries().subscribe({
      next: (response) => {
        this.queries = response.content || [];
      },
      error: () => {
        this.toastService.error('Échec du chargement des requêtes');
      }
    });
  }

  createNewQuery(): void {
    this.editingQuery = {
      name: '',
      description: '',
      sqlQuery: '',
      category: 'leads',
      isPublic: false
    };
  }

  editQuery(query: CustomQuery): void {
    this.editingQuery = { ...query };
  }

  saveQuery(): void {
    if (!this.editingQuery) return;

    const saveOperation = this.editingQuery.id
      ? this.analyticsService.updateCustomQuery(this.editingQuery.id, this.editingQuery)
      : this.analyticsService.createCustomQuery(this.editingQuery);

    saveOperation.subscribe({
      next: () => {
        this.toastService.success('Requête enregistrée avec succès');
        this.editingQuery = null;
        this.loadQueries();
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Échec de l\'enregistrement');
      }
    });
  }

  cancelEdit(): void {
    this.editingQuery = null;
  }

  executeQuery(query: CustomQuery): void {
    if (!query.id) return;

    this.analyticsService.executeCustomQuery(query.id, {}).subscribe({
      next: (results) => {
        this.queryResults = results;
        if (results.length > 0) {
          const keys = Object.keys(results[0]);
          this.resultDsColumns = keys.map(key => ({
            key,
            header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
          }));
        }
        this.toastService.success('Requête exécutée avec succès');
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Échec de l\'exécution');
      }
    });
  }

  onRowAction(event: { action: string; row: CustomQuery }): void {
    switch (event.action) {
      case 'edit':    this.editQuery(event.row); break;
      case 'execute': this.executeQuery(event.row); break;
      case 'delete':  this.deleteQuery(event.row); break;
    }
  }

  deleteQuery(query: CustomQuery): void {
    if (!query.id) return;

    if (confirm(`Voulez-vous vraiment supprimer la requête "${query.name}" ?`)) {
      this.analyticsService.deleteCustomQuery(query.id).subscribe({
        next: () => {
          this.toastService.success('Requête supprimée');
          this.loadQueries();
        },
        error: () => {
          this.toastService.error('Échec de la suppression');
        }
      });
    }
  }

  onCategoryChange(): void {
    if (this.selectedCategory) {
      this.analyticsService.getQueriesByCategory(this.selectedCategory).subscribe({
        next: (queries) => {
          this.queries = queries;
        }
      });
    } else {
      this.loadQueries();
    }
  }

  exportResults(): void {
    if (!this.queryResults) return;

    const csv = this.convertToCSV(this.queryResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  }
}
