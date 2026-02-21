import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { 
  WhatsAppTemplateApiService, 
  WhatsAppTemplateResponse,
  WhatsAppTemplateRequest,
  TemplateVersionResponse
} from '../services/whatsapp-template-api.service';

@Component({
  selector: 'app-template-library',
  templateUrl: './template-library.component.html',
  styleUrls: ['./template-library.component.css']
})
export class TemplateLibraryComponent implements OnInit {
  templates: WhatsAppTemplateResponse[] = [];
  filteredTemplates: WhatsAppTemplateResponse[] = [];
  loading = false;
  
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedLanguage = '';

  categories = [
    { value: '', label: 'All Categories' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
    { value: 'TRANSACTIONAL', label: 'Transactional' }
  ];

  statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ];

  languages = [
    { value: '', label: 'All Languages' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' }
  ];

  displayedColumns = ['name', 'language', 'category', 'status', 'version', 'updated', 'actions'];

  constructor(
    private templateService: WhatsAppTemplateApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

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
        this.snackBar.open('Failed to load templates', 'Close', { duration: 3000 });
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
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
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

  editTemplate(template: WhatsAppTemplateResponse): void {
    this.router.navigate(['/templates/edit', template.id]);
  }

  viewVersions(template: WhatsAppTemplateResponse): void {
    this.router.navigate(['/templates', template.id, 'versions']);
  }

  submitForApproval(template: WhatsAppTemplateResponse): void {
    if (confirm(`Submit template "${template.name}" for approval?`)) {
      this.templateService.submitForApproval(template.id).subscribe({
        next: (updated) => {
          this.snackBar.open('Template submitted for approval', 'Close', { duration: 3000 });
          this.updateTemplateInList(updated);
        },
        error: (error) => {
          console.error('Error submitting template', error);
          this.snackBar.open('Submission failed', 'Close', { duration: 3000 });
        }
      });
    }
  }

  pollApprovalStatus(template: WhatsAppTemplateResponse): void {
    this.templateService.pollApprovalStatus(template.id).subscribe({
      next: (updated) => {
        this.snackBar.open(`Status updated: ${updated.status}`, 'Close', { duration: 3000 });
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error polling status', error);
        this.snackBar.open('Failed to poll status', 'Close', { duration: 3000 });
      }
    });
  }

  activateTemplate(template: WhatsAppTemplateResponse): void {
    this.templateService.activateTemplate(template.id).subscribe({
      next: (updated) => {
        this.snackBar.open('Template activated', 'Close', { duration: 3000 });
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error activating template', error);
        this.snackBar.open('Activation failed', 'Close', { duration: 3000 });
      }
    });
  }

  pauseTemplate(template: WhatsAppTemplateResponse): void {
    this.templateService.pauseTemplate(template.id).subscribe({
      next: (updated) => {
        this.snackBar.open('Template paused', 'Close', { duration: 3000 });
        this.updateTemplateInList(updated);
      },
      error: (error) => {
        console.error('Error pausing template', error);
        this.snackBar.open('Pause failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteTemplate(template: WhatsAppTemplateResponse): void {
    if (confirm(`Delete template "${template.name}"? This action cannot be undone.`)) {
      this.templateService.deleteTemplate(template.id).subscribe({
        next: () => {
          this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
          this.removeTemplateFromList(template.id);
        },
        error: (error) => {
          console.error('Error deleting template', error);
          this.snackBar.open('Deletion failed', 'Close', { duration: 3000 });
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

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'DRAFT': 'gray',
      'PENDING': 'orange',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'PAUSED': 'yellow',
      'ACTIVE': 'blue',
      'INACTIVE': 'gray'
    };
    return colors[status] || 'gray';
  }

  canSubmitForApproval(template: WhatsAppTemplateResponse): boolean {
    return template.status === 'DRAFT';
  }

  canPollStatus(template: WhatsAppTemplateResponse): boolean {
    return template.status === 'PENDING' && !!template.metaSubmissionId;
  }

  canActivate(template: WhatsAppTemplateResponse): boolean {
    return template.status === 'APPROVED' || template.status === 'INACTIVE';
  }

  canPause(template: WhatsAppTemplateResponse): boolean {
    return template.status === 'APPROVED' || template.status === 'ACTIVE';
  }

  canDelete(template: WhatsAppTemplateResponse): boolean {
    return template.status !== 'ACTIVE';
  }
}
