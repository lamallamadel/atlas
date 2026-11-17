import { Component, OnInit, inject } from '@angular/core';
import { WorkflowApiService, WorkflowTemplate } from '../services/workflow-api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  DsCardComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsSkeletonComponent,
  DsFilterChipComponent,
  DsToastService,
  DsBadgeComponent
} from '../design-system';

@Component({
  selector: 'app-workflow-template-library',
  standalone: true,
  imports: [
    CommonModule,
    DsCardComponent, 
    DsSkeletonComponent, 
    DsButtonComponent, 
    DsIconComponent,
    DsFilterChipComponent,
    DsBadgeComponent
  ],
  templateUrl: './workflow-template-library.component.html',
  styleUrls: ['./workflow-template-library.component.scss']
})
export class WorkflowTemplateLibraryComponent implements OnInit {
  private workflowApi = inject(WorkflowApiService);
  private toastService = inject(DsToastService);
  private router = inject(Router);

  templates: WorkflowTemplate[] = [];
  filteredTemplates: WorkflowTemplate[] = [];
  selectedCategory = '';
  categories = ['SALE', 'RENTAL', 'MANDATE', 'CONSTRUCTION'];
  isLoading = false;

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.workflowApi.listTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.filteredTemplates = templates;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Erreur lors du chargement des modèles: ' + error.message);
        this.isLoading = false;
      }
    });
  }

  filterByCategory(category: string | undefined): void {
    const c = category ?? '';
    this.selectedCategory = c;
    if (c) {
      this.filteredTemplates = this.templates.filter((t) => t.category === c);
    } else {
      this.filteredTemplates = this.templates;
    }
  }

  instantiateTemplate(templateId: number, name: string): void {
    this.workflowApi.instantiateTemplate(templateId, name).subscribe({
      next: (workflow) => {
        this.toastService.success('Modèle instancié avec succès');
        this.router.navigate(['/workflow-builder'], { queryParams: { id: workflow.id } });
      },
      error: (error) => {
        this.toastService.error('Erreur lors de l\'instanciation du modèle: ' + error.message);
      }
    });
  }

  seedTemplates(): void {
    this.workflowApi.seedTemplates().subscribe({
      next: () => {
        this.toastService.success('Modèles initialisés avec succès');
        this.loadTemplates();
      },
      error: (error) => {
        this.toastService.error('Erreur lors de l\'initialisation des modèles: ' + error.message);
      }
    });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'SALE': return 'home';
      case 'RENTAL': return 'refresh';
      case 'MANDATE': return 'edit';
      case 'CONSTRUCTION': return 'refresh';
      default: return 'folder';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'SALE': return 'var(--ds-marine)';
      case 'RENTAL': return 'var(--ds-success)';
      case 'MANDATE': return 'var(--ds-warning)';
      case 'CONSTRUCTION': return 'var(--ds-primary)';
      default: return 'var(--ds-text-muted)';
    }
  }
}
