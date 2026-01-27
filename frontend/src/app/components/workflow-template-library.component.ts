import { Component, OnInit } from '@angular/core';
import { WorkflowApiService, WorkflowTemplate } from '../services/workflow-api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workflow-template-library',
  templateUrl: './workflow-template-library.component.html',
  styleUrls: ['./workflow-template-library.component.css']
})
export class WorkflowTemplateLibraryComponent implements OnInit {
  templates: WorkflowTemplate[] = [];
  filteredTemplates: WorkflowTemplate[] = [];
  selectedCategory: string = '';
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

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category) {
      this.filteredTemplates = this.templates.filter(t => t.category === category);
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
      case 'SALE': return 'home';
      case 'RENTAL': return 'apartment';
      case 'MANDATE': return 'gavel';
      case 'CONSTRUCTION': return 'construction';
      default: return 'category';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'SALE': return '#3B82F6';
      case 'RENTAL': return '#10B981';
      case 'MANDATE': return '#F59E0B';
      case 'CONSTRUCTION': return '#8B5CF6';
      default: return '#6B7280';
    }
  }
}
