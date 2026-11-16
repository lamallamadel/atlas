import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  WhatsAppTemplateApiService, 
  WhatsAppTemplateResponse
} from '../services/whatsapp-template-api.service';
import { 
  DsCardComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsInputComponent,
  DsSkeletonComponent,
  DsBadgeComponent,
  DsToastService,
  DsTableComponent,
  DsColumn,
  DsRowAction,
  DsEmptyStateComponent
} from '../design-system';

@Component({
  selector: 'app-template-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DsSkeletonComponent,
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsSelectComponent,
    DsInputComponent,
    DsBadgeComponent,
    DsTableComponent,
    DsEmptyStateComponent,
    DsCellDirective
  ],
  template: `
    <div class="template-library ds-form-stack" style="padding: 32px; max-width: var(--ds-content-wide); margin: 0 auto;">
      <header style="margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: var(--ds-marine); font-family: var(--ds-font-display);">Bibliothèque de modèles WhatsApp</h1>
        <p style="margin: 8px 0 0; color: var(--ds-text-muted);">Gérez vos modèles officiels approuvés par Meta</p>
      </header>

      <ds-card [pad]="true" elevation="sm">
        <div class="library-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--ds-marine);">Mes modèles</h2>
          <ds-button variant="marine" size="md" (dsClick)="createTemplate()">
            <ds-icon name="plus" [size]="20" style="margin-right: 8px;"></ds-icon>
            Créer un modèle
          </ds-button>
        </div>

        <!-- Filters -->
        <div class="filters-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; align-items: flex-end; margin-bottom: 32px; padding: 20px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md);">
          <ds-input label="Rechercher" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Nom..." prefixIcon="search"></ds-input>
          <ds-select label="Catégorie" [options]="categories" [(ngModel)]="selectedCategory" (valueChange)="applyFilters()"></ds-select>
          <ds-select label="Statut" [options]="statuses" [(ngModel)]="selectedStatus" (valueChange)="applyFilters()"></ds-select>
          <ds-select label="Langue" [options]="languages" [(ngModel)]="selectedLanguage" (valueChange)="applyFilters()"></ds-select>
          <ds-button variant="ghost" size="md" (dsClick)="clearFilters()">Réinitialiser</ds-button>
        </div>

        <!-- Table -->
        @if (loading) {
          <div style="padding: 48px 0;">
            <ds-skeleton variant="rect" width="100%" height="300px" [animate]="true"></ds-skeleton>
          </div>
        }

        @if (!loading) {
          <ds-table
            [columns]="dsColumns"
            [data]="filteredTemplates"
            [rowActions]="dsRowActions"
            (rowAction)="onRowAction($event)"
            emptyTitle="Aucun modèle trouvé"
            emptyDescription="Ajustez vos filtres ou créez un nouveau modèle de message.">
            
            <ng-template dsCell="name" let-t>
              <span style="font-weight: 700; color: var(--ds-marine);">{{ t.name }}</span>
            </ng-template>

            <ng-template dsCell="status" let-t>
              <ds-badge [status]="getStatusBadgeStatus(t.status)" [showDot]="false" size="sm">{{ t.status }}</ds-badge>
            </ng-template>

            <ng-template dsCell="updatedAt" let-t>
              {{ t.updatedAt | date:'short' }}
            </ng-template>
          </ds-table>
        }
      </ds-card>
    </div>
    `
})
export class TemplateLibraryComponent implements OnInit {
  private templateService = inject(WhatsAppTemplateApiService);
  private toastService = inject(DsToastService);
  private router = inject(Router);

  templates: WhatsAppTemplateResponse[] = [];
  filteredTemplates: WhatsAppTemplateResponse[] = [];
  loading = false;
  
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedLanguage = '';

  dsColumns: DsColumn<WhatsAppTemplateResponse>[] = [
    { key: 'name',     header: 'Nom' },
    { key: 'language', header: 'Langue' },
    { key: 'category', header: 'Catégorie' },
    { key: 'status',   header: 'Statut' },
    { key: 'version',  header: 'v.' },
    { key: 'updatedAt', header: 'Mise à jour' }
  ];

  dsRowActions: DsRowAction<WhatsAppTemplateResponse>[] = [
    { icon: 'edit',    label: 'Modifier',        action: 'edit',    ariaLabel: 'Modifier le modèle' },
    { icon: 'clock',   label: 'Historique',      action: 'history', ariaLabel: 'Voir les versions' },
    { icon: 'upload',  label: 'Soumettre',       action: 'submit',  ariaLabel: 'Soumettre pour approbation', show: (t) => this.canSubmitForApproval(t) },
    { icon: 'refresh', label: 'Vérifier statut', action: 'poll',    ariaLabel: 'Vérifier le statut Meta',     show: (t) => this.canPollStatus(t) },
    { icon: 'check',   label: 'Activer',         action: 'activate', ariaLabel: 'Activer le modèle',          show: (t) => this.canActivate(t) },
    { icon: 'refresh', label: 'Pause',           action: 'pause',   ariaLabel: 'Mettre en pause',             show: (t) => this.canPause(t) },
    { icon: 'trash',   label: 'Supprimer',       action: 'delete',  ariaLabel: 'Supprimer le modèle',         show: (t) => this.canDelete(t) }
  ];

  readonly categories: DsSelectOption[] = [
    { value: '', label: 'Toutes catégories' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utilitaire' },
    { value: 'AUTHENTICATION', label: 'Authentification' },
    { value: 'TRANSACTIONAL', label: 'Transactionnel' }
  ];

  readonly statuses: DsSelectOption[] = [
    { value: '', label: 'Tous statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvé' },
    { value: 'REJECTED', label: 'Rejeté' },
    { value: 'PAUSED', label: 'En pause' },
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'INACTIVE', label: 'Inactif' }
  ];

  readonly languages: DsSelectOption[] = [
    { value: '', label: 'Toutes langues' },
    { value: 'en', label: 'Anglais' },
    { value: 'es', label: 'Espagnol' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Allemand' },
    { value: 'pt', label: 'Portugais' }
  ];

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getAllTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.toastService.error('Échec du chargement des modèles');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loading = true;
    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedLanguage) filters.language = this.selectedLanguage;
    if (this.searchTerm) filters.searchTerm = this.searchTerm;

    if (Object.keys(filters).length === 0) {
      this.filteredTemplates = this.templates;
      this.loading = false;
      return;
    }

    this.templateService.searchTemplates(filters).subscribe({
      next: (templates) => {
        this.filteredTemplates = templates;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching templates', error);
        this.toastService.error('Échec de la recherche');
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedLanguage = '';
    this.filteredTemplates = this.templates;
  }

  createTemplate(): void {
    this.router.navigate(['/templates/create']);
  }

  onRowAction(event: { action: string; row: WhatsAppTemplateResponse }): void {
    const t = event.row;
    switch (event.action) {
      case 'edit':     this.editTemplate(t); break;
      case 'history':  this.viewVersions(t); break;
      case 'submit':   this.submitForApproval(t); break;
      case 'poll':     this.pollApprovalStatus(t); break;
      case 'activate': this.activateTemplate(t); break;
      case 'pause':    this.pauseTemplate(t); break;
      case 'delete':   this.deleteTemplate(t); break;
    }
  }

  editTemplate(template: WhatsAppTemplateResponse): void {
    this.router.navigate(['/templates/edit', template.id]);
  }

  viewVersions(template: WhatsAppTemplateResponse): void {
    this.router.navigate(['/templates', template.id, 'versions']);
  }

  submitForApproval(template: WhatsAppTemplateResponse): void {
    if (confirm(`Soumettre le modèle "${template.name}" pour approbation ?`)) {
      this.templateService.submitForApproval(template.id).subscribe({
        next: (updated) => {
          this.toastService.success('Modèle soumis pour approbation');
          this.updateTemplateInList(updated);
        },
        error: (error) => {
          console.error('Error submitting template', error);
          this.toastService.error('Échec de la soumission');
        }
      });
    }
  }

  pollApprovalStatus(template: WhatsAppTemplateResponse): void {
    this.templateService.pollApprovalStatus(template.id).subscribe({
      next: (updated) => {
        this.toastService.success(`Statut mis à jour : ${updated.status}`);
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error polling status', error);
        this.toastService.error('Échec de la mise à jour du statut');
      }
    });
  }

  activateTemplate(template: WhatsAppTemplateResponse): void {
    this.templateService.activateTemplate(template.id).subscribe({
      next: (updated) => {
        this.toastService.success('Modèle activé');
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error activating template', error);
        this.toastService.error('Échec de l\'activation');
      }
    });
  }

  pauseTemplate(template: WhatsAppTemplateResponse): void {
    this.templateService.pauseTemplate(template.id).subscribe({
      next: (updated) => {
        this.toastService.success('Modèle mis en pause');
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error pausing template', error);
        this.toastService.error('Échec de la mise en pause');
      }
    });
  }

  deleteTemplate(template: WhatsAppTemplateResponse): void {
    if (confirm(`Supprimer le modèle "${template.name}" ? Cette action est irréversible.`)) {
      this.templateService.deleteTemplate(template.id).subscribe({
        next: () => {
          this.toastService.success('Modèle supprimé');
          this.removeTemplateFromList(template.id);
        },
        error: (error) => {
          console.error('Error deleting template', error);
          this.toastService.error('Échec de la suppression');
        }
      });
    }
  }

  private updateTemplateInList(updated: WhatsAppTemplateResponse): void {
    const index = this.templates.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      this.templates[index] = updated;
      this.applyFilters();
    }
  }

  private removeTemplateFromList(id: number): void {
    this.templates = this.templates.filter(t => t.id !== id);
    this.applyFilters();
  }

  getStatusBadgeStatus(status: string): any {
    const map: Record<string, any> = {
      'DRAFT': 'draft',
      'PENDING': 'paused',
      'APPROVED': 'active',
      'REJECTED': 'lost',
      'PAUSED': 'warning',
      'ACTIVE': 'active',
      'INACTIVE': 'neutral'
    };
    return map[status] || 'neutral';
  }

  canSubmitForApproval(template: WhatsAppTemplateResponse): boolean { return template.status === 'DRAFT'; }
  canPollStatus(template: WhatsAppTemplateResponse): boolean { return template.status === 'PENDING' && !!template.metaSubmissionId; }
  canActivate(template: WhatsAppTemplateResponse): boolean { return template.status === 'APPROVED' || template.status === 'INACTIVE'; }
  canPause(template: WhatsAppTemplateResponse): boolean { return template.status === 'APPROVED' || template.status === 'ACTIVE'; }
  canDelete(template: WhatsAppTemplateResponse): boolean { return template.status !== 'ACTIVE'; }
}
