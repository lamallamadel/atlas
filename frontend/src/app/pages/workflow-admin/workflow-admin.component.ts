import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowConfigService } from './services/workflow-config.service';
import { WorkflowConfiguration, CaseType } from './models/workflow.model';
import { 
  DsCardComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsTabsComponent, 
  DsTab,
  DsToastService
} from '../../design-system';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';
import { WorkflowPreviewComponent } from './workflow-preview/workflow-preview.component';
import { TransitionRuleFormComponent } from './transition-rule-form/transition-rule-form.component';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../design-system/index';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-workflow-admin',
    standalone: true,
    templateUrl: './workflow-admin.component.html',
    styleUrls: ['./workflow-admin.component.scss'],
    imports: [
      CommonModule,
      DsCardComponent, 
      DsButtonComponent, 
      DsIconComponent, 
      DsTabsComponent, 
      WorkflowEditorComponent, 
      WorkflowPreviewComponent, 
      TransitionRuleFormComponent, 
      RouterLink, 
      PageHeaderComponent
    ]
})
export class WorkflowAdminComponent implements OnInit, OnDestroy {
  private workflowService = inject(WorkflowConfigService);
  private toastService = inject(DsToastService);

  workflow: WorkflowConfiguration | null = null;
  
  tabs: DsTab[] = [
    { value: 'editor', label: 'Éditeur' },
    { value: 'preview', label: 'Aperçu' },
    { value: 'rules', label: 'Règles & Automatisations' },
    { value: 'whatsapp', label: 'Modèles WhatsApp' }
  ];
  activeTab = 'editor';
  
  CaseType = CaseType;
  
  private destroy$ = new Subject<void>();

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
        this.toastService.success('Workflow sauvegardé avec succès');
      },
      error: () => {
        this.toastService.error('Erreur lors de la sauvegarde du workflow');
      }
    });
  }
}
