import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TemplateApiService } from '../services/template-api.service';
import { WhatsAppTemplate, TemplateStatus, TemplateCategory, ComponentType, TemplateComponent, TemplateVariable, ButtonType } from '../models/template.model';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.css']
})
export class TemplateEditorComponent implements OnInit, OnDestroy {
  templateForm!: FormGroup;
  templateId?: number;
  isEditMode = false;
  isViewMode = false;
  loading = false;
  previewTemplate?: WhatsAppTemplate;

  TemplateCategory = TemplateCategory;
  ComponentType = ComponentType;
  ButtonType = ButtonType;
  
  categories = Object.values(TemplateCategory);
  componentTypes = Object.values(ComponentType);
  buttonTypes = Object.values(ButtonType);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private templateService: TemplateApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.templateId = +params['id'];
        this.isEditMode = this.router.url.includes('edit');
        this.isViewMode = !this.isEditMode;
        this.loadTemplate(this.templateId);
      } else {
        const state = window.history.state;
        if (state?.template) {
          this.populateForm(state.template);
        }
      }
    });

    this.templateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePreview();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      language: ['en', [Validators.required, Validators.pattern(/^[a-z]{2}(_[A-Z]{2})?$/)]],
      category: [TemplateCategory.TRANSACTIONAL, Validators.required],
      description: [''],
      headerText: [''],
      bodyText: ['', Validators.required],
      footerText: [''],
      buttons: this.fb.array([]),
      variables: this.fb.array([])
    });
  }

  get buttons(): FormArray {
    return this.templateForm.get('buttons') as FormArray;
  }

  get variables(): FormArray {
    return this.templateForm.get('variables') as FormArray;
  }

  addButton(): void {
    const buttonGroup = this.fb.group({
      type: [ButtonType.QUICK_REPLY, Validators.required],
      text: ['', Validators.required],
      url: [''],
      phoneNumber: ['']
    });

    this.buttons.push(buttonGroup);
  }

  removeButton(index: number): void {
    this.buttons.removeAt(index);
  }

  addVariable(): void {
    const variableGroup = this.fb.group({
      variableName: ['', Validators.required],
      componentType: [ComponentType.BODY, Validators.required],
      position: [this.variables.length + 1, Validators.required],
      exampleValue: [''],
      description: [''],
      isRequired: [true]
    });

    this.variables.push(variableGroup);
  }

  removeVariable(index: number): void {
    this.variables.removeAt(index);
    this.updateVariablePositions();
  }

  onVariableDrop(event: CdkDragDrop<any[]>): void {
    const variablesArray = this.variables.controls;
    moveItemInArray(variablesArray, event.previousIndex, event.currentIndex);
    this.updateVariablePositions();
  }

  updateVariablePositions(): void {
    this.variables.controls.forEach((control, index) => {
      control.patchValue({ position: index + 1 });
    });
  }

  insertVariablePlaceholder(componentField: string): void {
    const variableName = prompt('Enter variable name (e.g., customer_name):');
    if (variableName) {
      const currentValue = this.templateForm.get(componentField)?.value || '';
      const placeholder = `{{${variableName}}}`;
      this.templateForm.get(componentField)?.setValue(currentValue + placeholder);
      
      const exists = this.variables.controls.some(
        control => control.get('variableName')?.value === variableName
      );
      
      if (!exists) {
        const componentType = this.getComponentTypeFromField(componentField);
        this.variables.push(this.fb.group({
          variableName: [variableName, Validators.required],
          componentType: [componentType, Validators.required],
          position: [this.variables.length + 1, Validators.required],
          exampleValue: [''],
          description: [''],
          isRequired: [true]
        }));
      }
    }
  }

  getComponentTypeFromField(field: string): ComponentType {
    if (field === 'headerText') return ComponentType.HEADER;
    if (field === 'bodyText') return ComponentType.BODY;
    if (field === 'footerText') return ComponentType.FOOTER;
    return ComponentType.BODY;
  }

  loadTemplate(id: number): void {
    this.loading = true;
    this.templateService.getTemplateById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template) => {
          this.populateForm(template);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading template:', error);
          this.snackBar.open('Error loading template', 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
  }

  populateForm(template: WhatsAppTemplate): void {
    this.templateForm.patchValue({
      name: template.name,
      language: template.language,
      category: template.category,
      description: template.description
    });

    template.components?.forEach(component => {
      if (component.type === ComponentType.HEADER && component.text) {
        this.templateForm.patchValue({ headerText: component.text });
      } else if (component.type === ComponentType.BODY && component.text) {
        this.templateForm.patchValue({ bodyText: component.text });
      } else if (component.type === ComponentType.FOOTER && component.text) {
        this.templateForm.patchValue({ footerText: component.text });
      } else if (component.type === ComponentType.BUTTONS && component.buttons) {
        component.buttons.forEach(button => {
          this.buttons.push(this.fb.group({
            type: [button.type],
            text: [button.text],
            url: [button.url || ''],
            phoneNumber: [button.phoneNumber || '']
          }));
        });
      }
    });

    template.variables?.forEach(variable => {
      this.variables.push(this.fb.group({
        variableName: [variable.variableName],
        componentType: [variable.componentType],
        position: [variable.position],
        exampleValue: [variable.exampleValue || ''],
        description: [variable.description || ''],
        isRequired: [variable.isRequired]
      }));
    });

    if (this.isViewMode) {
      this.templateForm.disable();
    }

    this.updatePreview();
  }

  updatePreview(): void {
    if (!this.templateForm.valid) return;

    const formValue = this.templateForm.value;
    const components: TemplateComponent[] = [];

    if (formValue.headerText) {
      components.push({
        type: ComponentType.HEADER,
        text: formValue.headerText
      });
    }

    if (formValue.bodyText) {
      components.push({
        type: ComponentType.BODY,
        text: formValue.bodyText
      });
    }

    if (formValue.footerText) {
      components.push({
        type: ComponentType.FOOTER,
        text: formValue.footerText
      });
    }

    if (formValue.buttons && formValue.buttons.length > 0) {
      components.push({
        type: ComponentType.BUTTONS,
        buttons: formValue.buttons
      });
    }

    this.previewTemplate = {
      name: formValue.name,
      language: formValue.language,
      category: formValue.category,
      status: TemplateStatus.DRAFT,
      components,
      variables: formValue.variables,
      description: formValue.description
    };
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 5000 });
      return;
    }

    const template = this.buildTemplateFromForm();
    this.loading = true;

    if (this.isEditMode && this.templateId) {
      this.templateService.updateTemplate(this.templateId, template)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Template updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/workflow-admin/templates']);
          },
          error: (error) => {
            console.error('Error updating template:', error);
            this.snackBar.open('Error updating template', 'Close', { duration: 5000 });
            this.loading = false;
          }
        });
    } else {
      this.templateService.createTemplate(template)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Template created successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/workflow-admin/templates']);
          },
          error: (error) => {
            console.error('Error creating template:', error);
            this.snackBar.open('Error creating template', 'Close', { duration: 5000 });
            this.loading = false;
          }
        });
    }
  }

  buildTemplateFromForm(): WhatsAppTemplate {
    const formValue = this.templateForm.value;
    const components: TemplateComponent[] = [];

    if (formValue.headerText) {
      components.push({
        type: ComponentType.HEADER,
        text: formValue.headerText
      });
    }

    components.push({
      type: ComponentType.BODY,
      text: formValue.bodyText
    });

    if (formValue.footerText) {
      components.push({
        type: ComponentType.FOOTER,
        text: formValue.footerText
      });
    }

    if (formValue.buttons && formValue.buttons.length > 0) {
      components.push({
        type: ComponentType.BUTTONS,
        buttons: formValue.buttons
      });
    }

    return {
      name: formValue.name,
      language: formValue.language,
      category: formValue.category,
      status: TemplateStatus.DRAFT,
      components,
      variables: formValue.variables,
      description: formValue.description
    };
  }

  cancel(): void {
    this.router.navigate(['/workflow-admin/templates']);
  }
}
