import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TemplateApiService } from '../services/template-api.service';
import { WhatsAppTemplate, TemplateStatus } from '../models/template.model';
import { FormsModule } from '@angular/forms';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { 
  DsBadgeStatus, 
  DsButtonComponent, 
  DsCardComponent, 
  DsEmptyStateComponent, 
  DsIconComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsBadgeComponent,
  DsToastService
} from '../../../design-system';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
    selector: 'app-template-library',
    standalone: true,
    templateUrl: './template-library.component.html',
    styleUrls: ['./template-library.component.scss'],
    imports: [
      CommonModule,
      FormsModule,
      DsCardComponent, 
      DsButtonComponent, 
      DsIconComponent, 
      DsEmptyStateComponent, 
      DsSkeletonComponent, 
      DsInputComponent,
      DsBadgeComponent,
      CdkConnectedOverlay, 
      CdkOverlayOrigin, 
      DatePipe
    ]
})
export class TemplateLibraryComponent implements OnInit, OnDestroy {
  private readonly overlay = inject(Overlay);
  private templateService = inject(TemplateApiService);
  private router = inject(Router);
  private toastService = inject(DsToastService);

  tplCardMenuOpenForId: number | null = null;
  readonly tplCardMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly tplCardMenuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];

  templates: WhatsAppTemplate[] = [];
  filteredTemplates: WhatsAppTemplate[] = [];
  selectedStatus: TemplateStatus | 'ALL' = 'ALL';
  searchQuery = '';
  loading = false;
  TemplateStatus = TemplateStatus;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getAllTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.templates = templates;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading templates:', error);
          this.toastService.error('Erreur lors du chargement des modèles');
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredTemplates = this.templates.filter(template => {
      const matchesStatus = this.selectedStatus === 'ALL' || template.status === this.selectedStatus;
      const matchesSearch = !this.searchQuery || 
        template.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange(status: TemplateStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  createNewTemplate(): void {
    this.router.navigate(['/workflow-admin/templates/new']);
  }

  editTemplate(template: WhatsAppTemplate): void {
    this.router.navigate(['/workflow-admin/templates', template.id, 'edit']);
  }

  viewTemplate(template: WhatsAppTemplate): void {
    this.router.navigate(['/workflow-admin/templates', template.id]);
  }

  toggleTplCardMenu(templateId: number | undefined, event: MouseEvent): void {
    event.stopPropagation();
    if (templateId == null) return;
    this.tplCardMenuOpenForId = this.tplCardMenuOpenForId === templateId ? null : templateId;
  }

  closeTplCardMenu(): void {
    this.tplCardMenuOpenForId = null;
  }

  duplicateTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    const duplicate = {
      ...template,
      id: undefined,
      name: `${template.name}_copy`,
      status: TemplateStatus.DRAFT,
      whatsAppTemplateId: undefined,
      rejectionReason: undefined
    };
    this.router.navigate(['/workflow-admin/templates/new'], { state: { template: duplicate } });
  }

  deleteTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    if (template.status === TemplateStatus.ACTIVE) {
      this.toastService.warning('Impossible de supprimer un modèle actif');
      return;
    }

    if (confirm(`Voulez-vous vraiment supprimer le modèle "${template.name}" ?`)) {
      this.templateService.deleteTemplate(template.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Modèle supprimé avec succès');
            this.loadTemplates();
          },
          error: (error) => {
            console.error('Error deleting template:', error);
            this.toastService.error('Erreur lors de la suppression');
          }
        });
    }
  }

  submitForApproval(template: WhatsAppTemplate): void {
    this.templateService.submitForApproval(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Modèle soumis pour approbation');
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error submitting template:', error);
          this.toastService.error('Erreur lors de la soumission');
        }
      });
  }

  pauseTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    this.templateService.deactivateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Modèle mis en pause');
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error pausing template:', error);
          this.toastService.error('Erreur lors de la mise en pause');
        }
      });
  }

  activateTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    this.templateService.activateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Modèle activé');
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error activating template:', error);
          this.toastService.error('Erreur lors de l’activation');
        }
      });
  }

  getStatusIcon(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.ACTIVE: return 'check';
      case TemplateStatus.PENDING_APPROVAL: return 'clock';
      case TemplateStatus.REJECTED: return 'info';
      case TemplateStatus.INACTIVE: return 'info';
      default: return 'edit';
    }
  }

  getStatusBadge(status: TemplateStatus): DsBadgeStatus {
    switch (status) {
      case TemplateStatus.ACTIVE: return 'success';
      case TemplateStatus.PENDING_APPROVAL: return 'warning';
      case TemplateStatus.REJECTED: return 'error';
      case TemplateStatus.INACTIVE: return 'neutral';
      default: return 'draft';
    }
  }

  getCategoryDisplay(category: string): string {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
}
