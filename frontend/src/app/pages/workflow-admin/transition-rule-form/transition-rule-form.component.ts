import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowConfigService } from '../services/workflow-config.service';
import { WorkflowConfiguration, TransitionRule, WorkflowNode } from '../models/workflow.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatChipListbox, MatChip, MatChipRemove } from '@angular/material/chips';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-transition-rule-form',
    templateUrl: './transition-rule-form.component.html',
    styleUrls: ['./transition-rule-form.component.css'],
    imports: [MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatIcon, MatTooltip, FormsModule, ReactiveFormsModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatFormField, MatLabel, MatInput, MatSuffix, MatChipListbox, MatChip, MatChipRemove, MatSelect, MatOption, MatSlideToggle, MatButton]
})
export class TransitionRuleFormComponent implements OnInit, OnDestroy {
  workflow: WorkflowConfiguration | null = null;
  selectedTransition: TransitionRule | null = null;
  transitionForm: FormGroup;
  
  availableFields: string[] = [
    'leadName',
    'leadPhone',
    'leadSource',
    'title',
    'description',
    'price',
    'city',
    'address',
    'category',
    'type'
  ];

  availableRoles: string[] = [
    'ADMIN',
    'AGENT',
    'MANAGER',
    'VIEWER'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowConfigService,
    private snackBar: MatSnackBar
  ) {
    this.transitionForm = this.createForm();
  }

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

  createForm(): FormGroup {
    return this.fb.group({
      fromStatus: ['', Validators.required],
      toStatus: ['', Validators.required],
      label: [''],
      requiredFields: this.fb.array([]),
      allowedRoles: this.fb.array([]),
      requiresApproval: [false],
      conditions: ['']
    });
  }

  get requiredFieldsArray(): FormArray {
    return this.transitionForm.get('requiredFields') as FormArray;
  }

  get allowedRolesArray(): FormArray {
    return this.transitionForm.get('allowedRoles') as FormArray;
  }

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
    (transition.requiredFields || []).forEach(field => {
      this.requiredFieldsArray.push(this.fb.control(field));
    });

    this.allowedRolesArray.clear();
    (transition.allowedRoles || []).forEach(role => {
      this.allowedRolesArray.push(this.fb.control(role));
    });
  }

  addRequiredField(field: string): void {
    if (field && !this.requiredFieldsArray.value.includes(field)) {
      this.requiredFieldsArray.push(this.fb.control(field));
    }
  }

  removeRequiredField(index: number): void {
    this.requiredFieldsArray.removeAt(index);
  }

  addAllowedRole(role: string): void {
    if (role && !this.allowedRolesArray.value.includes(role)) {
      this.allowedRolesArray.push(this.fb.control(role));
    }
  }

  removeAllowedRole(index: number): void {
    this.allowedRolesArray.removeAt(index);
  }

  getTransitionsForNode(node: WorkflowNode): TransitionRule[] {
    if (!this.workflow) return [];
    return this.workflow.transitions.filter(t => t.fromStatus === node.status);
  }

  onSaveTransition(): void {
    if (!this.transitionForm.valid || !this.selectedTransition) {
      return;
    }

    const formValue = this.transitionForm.value;
    const updates: Partial<TransitionRule> = {
      label: formValue.label,
      requiredFields: formValue.requiredFields,
      allowedRoles: formValue.allowedRoles,
      requiresApproval: formValue.requiresApproval,
      conditions: formValue.conditions
    };

    this.workflowService.updateTransition(this.selectedTransition.id, updates);
    
    this.snackBar.open('Règle de transition mise à jour', 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  onDeleteTransition(): void {
    if (!this.selectedTransition) return;

    this.workflowService.deleteTransition(this.selectedTransition.id);
    this.selectedTransition = null;
    this.transitionForm.reset();
    
    this.snackBar.open('Transition supprimée', 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  getAvailableFromStatuses(): string[] {
    return this.workflow?.nodes.map(n => n.status) || [];
  }

  getAvailableToStatuses(): string[] {
    return this.workflow?.nodes.map(n => n.status) || [];
  }
}
