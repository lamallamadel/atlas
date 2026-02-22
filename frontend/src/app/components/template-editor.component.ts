import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { WhatsAppTemplateRequest, WhatsAppTemplateResponse } from '../services/whatsapp-template-api.service';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.css']
})
export class TemplateEditorComponent implements OnInit {
  @Input() template?: WhatsAppTemplateResponse;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() save = new EventEmitter<WhatsAppTemplateRequest>();
  @Output() cancel = new EventEmitter<void>();

  templateForm!: FormGroup;
  previewText = '';
  previewVariables: { [key: string]: string } = {};

  categories = [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
    { value: 'TRANSACTIONAL', label: 'Transactional' }
  ];

  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' }
  ];

  componentTypes = [
    { value: 'HEADER', label: 'Header' },
    { value: 'BODY', label: 'Body' },
    { value: 'FOOTER', label: 'Footer' },
    { value: 'BUTTON', label: 'Button' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    if (this.template) {
      this.loadTemplate(this.template);
    }
    this.updatePreview();
  }

  initForm(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      language: ['en', Validators.required],
      category: ['TRANSACTIONAL', Validators.required],
      description: [''],
      bodyText: ['', Validators.required],
      headerText: [''],
      footerText: [''],
      buttons: this.fb.array([]),
      variables: this.fb.array([])
    });

    this.templateForm.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  loadTemplate(template: WhatsAppTemplateResponse): void {
    this.templateForm.patchValue({
      name: template.name,
      language: template.language,
      category: template.category,
      description: template.description
    });

    const bodyComponent = template.components.find(c => c.type === 'BODY');
    if (bodyComponent) {
      this.templateForm.patchValue({ bodyText: bodyComponent.text });
    }

    const headerComponent = template.components.find(c => c.type === 'HEADER');
    if (headerComponent) {
      this.templateForm.patchValue({ headerText: headerComponent.text });
    }

    const footerComponent = template.components.find(c => c.type === 'FOOTER');
    if (footerComponent) {
      this.templateForm.patchValue({ footerText: footerComponent.text });
    }

    if (template.variables) {
      template.variables.forEach(variable => {
        this.addVariable(variable.variableName, variable.componentType, 
                       variable.exampleValue || '', variable.isRequired);
      });
    }
  }

  get buttons(): FormArray {
    return this.templateForm.get('buttons') as FormArray;
  }

  get variables(): FormArray {
    return this.templateForm.get('variables') as FormArray;
  }

  addButton(): void {
    const buttonGroup = this.fb.group({
      type: ['QUICK_REPLY', Validators.required],
      text: ['', Validators.required]
    });
    this.buttons.push(buttonGroup);
  }

  removeButton(index: number): void {
    this.buttons.removeAt(index);
  }

  addVariable(name = '', componentType = 'BODY', 
              exampleValue = '', isRequired = true): void {
    const position = this.variables.length + 1;
    const variableGroup = this.fb.group({
      variableName: [name || `var${position}`, Validators.required],
      componentType: [componentType, Validators.required],
      position: [position],
      exampleValue: [exampleValue],
      isRequired: [isRequired]
    });
    this.variables.push(variableGroup);
    
    if (exampleValue) {
      this.previewVariables[name || `var${position}`] = exampleValue;
    }
  }

  removeVariable(index: number): void {
    const varName = this.variables.at(index).value.variableName;
    delete this.previewVariables[varName];
    this.variables.removeAt(index);
    this.updatePreview();
  }

  updateVariableExample(index: number, value: string): void {
    const varName = this.variables.at(index).value.variableName;
    this.previewVariables[varName] = value;
    this.updatePreview();
  }

  updatePreview(): void {
    const formValue = this.templateForm.value;
    let preview = '';

    if (formValue.headerText) {
      preview += `📌 ${this.interpolateVariables(formValue.headerText)}\n\n`;
    }

    if (formValue.bodyText) {
      preview += this.interpolateVariables(formValue.bodyText);
    }

    if (formValue.footerText) {
      preview += `\n\n---\n${this.interpolateVariables(formValue.footerText)}`;
    }

    if (formValue.buttons && formValue.buttons.length > 0) {
      preview += '\n\n';
      formValue.buttons.forEach((btn: any, idx: number) => {
        preview += `\n[${btn.text}]`;
      });
    }

    this.previewText = preview || 'Enter template content to see preview...';
  }

  interpolateVariables(text: string): string {
    if (!text) return '';
    
    let interpolated = text;
    
    Object.keys(this.previewVariables).forEach(varName => {
      const placeholder = `{{${varName}}}`;
      const value = this.previewVariables[varName] || `{${varName}}`;
      interpolated = interpolated.replace(new RegExp(placeholder, 'g'), value);
    });
    
    interpolated = interpolated.replace(/\{\{(\w+)\}\}/g, '{$1}');
    
    return interpolated;
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const formValue = this.templateForm.value;
    const components: any[] = [];

    if (formValue.headerText) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: formValue.headerText
      });
    }

    components.push({
      type: 'BODY',
      text: formValue.bodyText
    });

    if (formValue.footerText) {
      components.push({
        type: 'FOOTER',
        text: formValue.footerText
      });
    }

    if (formValue.buttons && formValue.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: formValue.buttons
      });
    }

    const request: WhatsAppTemplateRequest = {
      name: formValue.name,
      language: formValue.language,
      category: formValue.category,
      components: components,
      variables: formValue.variables,
      description: formValue.description
    };

    this.save.emit(request);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
