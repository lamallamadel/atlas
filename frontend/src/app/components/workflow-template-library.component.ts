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
  DsBadgeComponent,
  DsIconName
} from '../design-system';

type WorkflowCategory = 'SALE' | 'RENTAL' | 'MANDATE' | 'CONSTRUCTION';

const CATEGORY_META: Record<WorkflowCategory, { icon: DsIconName; color: string }> = {
  SALE:         { icon: 'home',    color: 'var(--ds-marine)'  },
  RENTAL:       { icon: 'refresh', color: 'var(--ds-success)' },
  MANDATE:      { icon: 'edit',    color: 'var(--ds-warning)' },
  CONSTRUCTION: { icon: 'refresh', color: 'var(--ds-primary)' },
};

const FALLBACK_META: { icon: DsIconName; color: string } = {
  icon: 'folder',
  color: 'var(--ds-text-muted)',
};

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
  selectedCategory: WorkflowCategory | '' = '';
  categories: WorkflowCategory[] = ['SALE', 'RENTAL', 'MANDATE', 'CONSTRUCTION'];
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

  filterByCategory(category: WorkflowCategory | '' | undefined): void {
    const c = category ?? '';
    this.selectedCategory = c;
    this.filteredTemplates = c
      ? this.templates.filter((t) => t.category === c)
      : this.templates;
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

  getCategoryIcon(category: string): DsIconName {
    return (CATEGORY_META[category as WorkflowCategory] ?? FALLBACK_META).icon;
  }

  getCategoryColor(category: string): string {
    return (CATEGORY_META[category as WorkflowCategory] ?? FALLBACK_META).color;
  }
}
