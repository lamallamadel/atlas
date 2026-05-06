import { Component, OnInit } from '@angular/core';
import { WorkflowApiService, WorkflowTemplate } from '../services/workflow-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DsCardComponent } from '../design-system';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { DsSkeletonComponent } from '../design-system/primitives/ds-skeleton/ds-skeleton.component';

@Component({
  selector: 'app-workflow-template-library',
  standalone: true,
  imports: [DsCardComponent, DsSkeletonComponent, MatButton, MatIcon, MatChipListbox, MatChipOption],
  templateUrl: './workflow-template-library.component.html',
  styleUrls: ['./workflow-template-library.component.css']
})
export class WorkflowTemplateLibraryComponent implements OnInit {
  templates: WorkflowTemplate[] = [];
  filteredTemplates: WorkflowTemplate[] = [];
  selectedCategory = '';
  categories = ['SALE', 'RENTAL', 'MANDATE', 'CONSTRUCTION'];
  isLoading = false;

  constructor(
    private workflowApi: WorkflowApiService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

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
        this.snackBar.open('Error loading templates: ' + error.message, 'Close', { duration: 5000 });
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
        this.snackBar.open('Template instantiated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/workflow-builder'], { queryParams: { id: workflow.id } });
      },
      error: (error) => {
        this.snackBar.open('Error instantiating template: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }

  seedTemplates(): void {
    this.workflowApi.seedTemplates().subscribe({
      next: () => {
        this.snackBar.open('Templates seeded successfully', 'Close', { duration: 3000 });
        this.loadTemplates();
      },
      error: (error) => {
        this.snackBar.open('Error seeding templates: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'SALE':
        return 'home';
      case 'RENTAL':
        return 'apartment';
      case 'MANDATE':
        return 'gavel';
      case 'CONSTRUCTION':
        return 'construction';
      default:
        return 'category';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'SALE':
        return 'var(--ds-marine)';
      case 'RENTAL':
        return 'var(--ds-success)';
      case 'MANDATE':
        return 'var(--ds-copper)';
      case 'CONSTRUCTION':
        return 'var(--ds-info)';
      default:
        return 'var(--ds-text-muted)';
    }
  }
}
