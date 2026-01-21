import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateApiService } from '../services/template-api.service';
import { WhatsAppTemplate, TemplateStatus } from '../models/template.model';

@Component({
  selector: 'app-template-library',
  templateUrl: './template-library.component.html',
  styleUrls: ['./template-library.component.css']
})
export class TemplateLibraryComponent implements OnInit, OnDestroy {
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
          this.snackBar.open('Error loading templates', 'Close', { duration: 5000 });
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

  duplicateTemplate(template: WhatsAppTemplate): void {
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
    if (template.status === TemplateStatus.ACTIVE) {
      this.snackBar.open('Cannot delete an active template. Please pause it first.', 'Close', { duration: 5000 });
      return;
    }

    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      this.templateService.deleteTemplate(template.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Template deleted successfully', 'Close', { duration: 3000 });
            this.loadTemplates();
          },
          error: (error) => {
            console.error('Error deleting template:', error);
            this.snackBar.open('Error deleting template', 'Close', { duration: 5000 });
          }
        });
    }
  }

  submitForApproval(template: WhatsAppTemplate): void {
    this.templateService.submitForApproval(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Template submitted for approval', 'Close', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error submitting template:', error);
          this.snackBar.open('Error submitting template for approval', 'Close', { duration: 5000 });
        }
      });
  }

  pauseTemplate(template: WhatsAppTemplate): void {
    this.templateService.deactivateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Template paused successfully', 'Close', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error pausing template:', error);
          this.snackBar.open('Error pausing template', 'Close', { duration: 5000 });
        }
      });
  }

  activateTemplate(template: WhatsAppTemplate): void {
    this.templateService.activateTemplate(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Template activated successfully', 'Close', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error activating template:', error);
          this.snackBar.open('Error activating template', 'Close', { duration: 5000 });
        }
      });
  }

  getStatusColor(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.ACTIVE:
        return 'accent';
      case TemplateStatus.PENDING_APPROVAL:
        return 'warn';
      case TemplateStatus.REJECTED:
        return 'warn';
      case TemplateStatus.INACTIVE:
        return '';
      default:
        return '';
    }
  }

  getStatusIcon(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.ACTIVE:
        return 'check_circle';
      case TemplateStatus.PENDING_APPROVAL:
        return 'schedule';
      case TemplateStatus.REJECTED:
        return 'cancel';
      case TemplateStatus.INACTIVE:
        return 'pause_circle';
      default:
        return 'edit';
    }
  }

  getCategoryDisplay(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
}
