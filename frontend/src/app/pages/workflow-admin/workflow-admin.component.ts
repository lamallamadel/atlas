import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowConfigService } from './services/workflow-config.service';
import { WorkflowConfiguration, CaseType } from './models/workflow.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { WorkflowPreviewComponent } from './workflow-preview/workflow-preview.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-workflow-admin',
    templateUrl: './workflow-admin.component.html',
    styleUrls: ['./workflow-admin.component.css'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatTabGroup, MatTab, MatButtonToggleGroup, MatButtonToggle, WorkflowEditorComponent, MatButton, MatIcon, WorkflowPreviewComponent, RouterLink]
})
export class WorkflowAdminComponent implements OnInit, OnDestroy {
  workflow: WorkflowConfiguration | null = null;
  selectedTab = 0;
  CaseType = CaseType;
  
  private destroy$ = new Subject<void>();

  constructor(
    private workflowService: WorkflowConfigService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.workflowService.workflow$
      .pipe(takeUntil(this.destroy$))
      .subscribe(workflow => {
        this.workflow = workflow;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCaseTypeChange(caseType: CaseType): void {
    this.workflowService.loadWorkflow(caseType);
  }

  onSaveWorkflow(): void {
    this.workflowService.saveWorkflow().subscribe({
      next: () => {
        this.snackBar.open('Workflow sauvegardé avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde du workflow', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
