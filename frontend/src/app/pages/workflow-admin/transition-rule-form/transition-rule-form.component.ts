import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowConfigService } from '../services/workflow-config.service';
import { WorkflowConfiguration, TransitionRule, WorkflowNode } from '../models/workflow.model';
import { 
  DsBadgeComponent, 
  DsButtonComponent, 
  DsCardComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsInputComponent,
  DsToastService
} from '../../../design-system';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-transition-rule-form',
    standalone: true,
    templateUrl: './transition-rule-form.component.html',
    styleUrls: ['./transition-rule-form.component.scss'],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule, 
      DsCardComponent, 
      DsIconComponent, 
      DsButtonComponent, 
      DsBadgeComponent, 
      DsSelectComponent,
      DsInputComponent
    ]
})
export class TransitionRuleFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private workflowService = inject(WorkflowConfigService);
  private toastService = inject(DsToastService);

  workflow: WorkflowConfiguration | null = null;
  selectedTransition: TransitionRule | null = null;
  transitionForm: FormGroup;
  
  readonly availableFields: string[] = ['leadName', 'leadPhone', 'leadSource', 'title', 'description', 'price', 'city', 'address', 'category', 'type'];
  readonly availableRoles: string[] = ['ADMIN', 'AGENT', 'MANAGER', 'VIEWER'];

  get statusOptions(): DsSelectOption[] {
    return this.workflow?.nodes.map(n => ({ value: n.status, label: n.label })) || [];
  }

  get fieldOptions(): DsSelectOption[] { return this.availableFields.map(f => ({ value: f, label: f })); }
  get roleOptions(): DsSelectOption[] { return this.availableRoles.map(r => ({ value: r, label: r })); }

  get actionTypeOptions(): DsSelectOption[] {
    return [
      { value: 'CREATE_TASK', label: 'Créer une tâche' },
      { value: 'SEND_EMAIL', label: 'Envoyer un email' },
      { value: 'SEND_WHATSAPP', label: 'Envoyer un WhatsApp' },
      { value: 'SCHEDULE_FOLLOWUP', label: 'Planifier un rappel' }
    ];
  }

  private destroy$ = new Subject<void>();

  constructor() {
    this.transitionForm = this.createForm();
  }

  ngOnInit(): void {
    this.workflowService.workflow$
      .pipe(takeUntil(this.destroy$))
      .subscribe(workflow => { this.workflow = workflow; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      fromStatus: ['', Validators.required],
      toStatus: ['', Validators.required],
      label: [''],
      requiredFields: this.fb.array([]),
      allowedRoles: this.fb.array([]),
      requiresApproval: [false],
      conditions: [''],
      actions: this.fb.array([])
    });
  }

  get requiredFieldsArray(): FormArray { return this.transitionForm.get('requiredFields') as FormArray; }
  get allowedRolesArray(): FormArray { return this.transitionForm.get('allowedRoles') as FormArray; }
  get actionsArray(): FormArray { return this.transitionForm.get('actions') as FormArray; }

  selectTransition(transition: TransitionRule): void {
    this.selectedTransition = transition;
    this.populateForm(transition);
  }

  populateForm(transition: TransitionRule): void {
    this.transitionForm.patchValue({
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      label: transition.label || '',
      requiresApproval: transition.requiresApproval || false,
      conditions: transition.conditions || ''
    });

    this.requiredFieldsArray.clear();
    (transition.requiredFields || []).forEach(field => { this.requiredFieldsArray.push(this.fb.control(field)); });

    this.allowedRolesArray.clear();
    (transition.allowedRoles || []).forEach(role => { this.allowedRolesArray.push(this.fb.control(role)); });

    this.actionsArray.clear();
    (transition.actionsJson || []).forEach(action => { this.actionsArray.push(this.createActionGroup(action)); });
  }

  createActionGroup(action?: any): FormGroup {
    return this.fb.group({
      type: [action?.type || 'SEND_EMAIL', Validators.required],
      title: [action?.title || ''],
      description: [action?.description || ''],
      dueInDays: [action?.dueInDays || 1],
      assignTo: [action?.assignTo || 'AGENT'],
      template: [action?.template || ''],
      subject: [action?.subject || ''],
      to: [action?.to || ''],
      delayHours: [action?.delayHours || 0],
      priority: [action?.priority || 'MEDIUM']
    });
  }

  addAction(type: string): void { this.actionsArray.push(this.createActionGroup({ type })); }
  removeAction(index: number): void { this.actionsArray.removeAt(index); }

  addRequiredField(field: string): void {
    if (field && !this.requiredFieldsArray.value.includes(field)) {
      this.requiredFieldsArray.push(this.fb.control(field));
    }
  }

  removeRequiredField(index: number): void { this.requiredFieldsArray.removeAt(index); }

  addAllowedRole(role: string): void {
    if (role && !this.allowedRolesArray.value.includes(role)) {
      this.allowedRolesArray.push(this.fb.control(role));
    }
  }

  removeAllowedRole(index: number): void { this.allowedRolesArray.removeAt(index); }

  onSaveTransition(): void {
    if (!this.transitionForm.valid || !this.selectedTransition) return;
    const formValue = this.transitionForm.value;
    const updates: Partial<TransitionRule> = {
      label: formValue.label,
      requiredFields: formValue.requiredFields,
      allowedRoles: formValue.allowedRoles,
      requiresApproval: formValue.requiresApproval,
      conditions: formValue.conditions,
      actionsJson: formValue.actions
    };
    this.workflowService.updateTransition(this.selectedTransition.id, updates);
    this.toastService.success('Règle de transition mise à jour');
  }

  onDeleteTransition(): void {
    if (!this.selectedTransition) return;
    this.workflowService.deleteTransition(this.selectedTransition.id);
    this.selectedTransition = null;
    this.transitionForm.reset();
    this.toastService.success('Transition supprimée');
  }

  getAvailableFromStatuses(): string[] { return this.workflow?.nodes.map(n => n.status) || []; }
  getAvailableToStatuses(): string[] { return this.workflow?.nodes.map(n => n.status) || []; }

  getTransitionsForNode(node: WorkflowNode): TransitionRule[] {
    if (!this.workflow) return [];
    return this.workflow.transitions.filter(t => t.fromStatus === node.status);
  }
}
