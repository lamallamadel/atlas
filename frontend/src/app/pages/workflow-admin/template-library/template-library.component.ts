import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateApiService } from '../services/template-api.service';
import { WhatsAppTemplate, TemplateStatus } from '../models/template.model';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { DsBadgeStatus, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsIconComponent } from '../../../design-system';
import { DsSkeletonComponent } from '../../../design-system/primitives/ds-skeleton/ds-skeleton.component';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-template-library',
    standalone: true,
    templateUrl: './template-library.component.html',
    styleUrls: ['./template-library.component.css'],
    imports: [MatFormField, MatLabel, MatInput, FormsModule, MatPrefix, MatButton, MatButtonToggleGroup, MatButtonToggle, DsCardComponent, DsButtonComponent, DsIconComponent, DsEmptyStateComponent, DsSkeletonComponent, CdkConnectedOverlay, CdkOverlayOrigin, DatePipe]
})
export class TemplateLibraryComponent implements OnInit, OnDestroy {
  private readonly overlay = inject(Overlay);

  /** Menu « ⋮ » par carte template (`mat-menu` → CDK). */
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

  constructor(
    private templateService: TemplateApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

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
          this.snackBar.open('Erreur lors du chargement des modèles', 'Fermer', { duration: 5000 });
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
    if (templateId == null) {
      return;
    }
    this.tplCardMenuOpenForId =
      this.tplCardMenuOpenForId === templateId ? null : templateId;
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
    
    this.router.navigate(['/workflow-admin/templates/new'], {
      state: { template: duplicate }
    });
  }

  deleteTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    if (template.status === TemplateStatus.ACTIVE) {
      this.snackBar.open('Impossible de supprimer un modèle actif. Mettez-le d’abord en pause.', 'Fermer', { duration: 5000 });
      return;
    }

    if (confirm(`Voulez-vous vraiment supprimer le modèle "${template.name}" ?`)) {
      this.templateService.deleteTemplate(template.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Modèle supprimé avec succès', 'Fermer', { duration: 3000 });
            this.loadTemplates();
          },
          error: (error) => {
            console.error('Error deleting template:', error);
            this.snackBar.open('Erreur lors de la suppression du modèle', 'Fermer', { duration: 5000 });
          }
        });
    }
  }

  submitForApproval(template: WhatsAppTemplate): void {
    this.templateService.submitForApproval(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Modèle soumis pour approbation', 'Fermer', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error submitting template:', error);
          this.snackBar.open('Erreur lors de la soumission du modèle', 'Fermer', { duration: 5000 });
        }
      });
  }

  pauseTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    this.templateService.deactivateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Modèle mis en pause avec succès', 'Fermer', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error pausing template:', error);
          this.snackBar.open('Erreur lors de la mise en pause du modèle', 'Fermer', { duration: 5000 });
        }
      });
  }

  activateTemplate(template: WhatsAppTemplate): void {
    this.closeTplCardMenu();
    this.templateService.activateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Modèle activé avec succès', 'Fermer', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error activating template:', error);
          this.snackBar.open('Erreur lors de l’activation du modèle', 'Fermer', { duration: 5000 });
        }
      });
  }

  getStatusIcon(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.ACTIVE:
        return 'check';
      case TemplateStatus.PENDING_APPROVAL:
        return 'clock';
      case TemplateStatus.REJECTED:
        return 'alert-circle';
      case TemplateStatus.INACTIVE:
        return 'info';
      default:
        return 'edit';
    }
  }

  getStatusBadge(status: TemplateStatus): DsBadgeStatus {
    switch (status) {
      case TemplateStatus.ACTIVE:
        return 'success';
      case TemplateStatus.PENDING_APPROVAL:
        return 'warning';
      case TemplateStatus.REJECTED:
        return 'error';
      case TemplateStatus.INACTIVE:
        return 'neutral';
      default:
        return 'draft';
    }
  }

  getCategoryDisplay(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
}
