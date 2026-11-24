import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { 
  WhatsAppTemplateApiService, 
  WhatsAppTemplateRequest, 
  WhatsAppTemplateResponse
} from '../../../services/whatsapp-template-api.service';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  DsCardComponent,
  DsButtonComponent,
  DsIconComponent,
  DsSelectComponent,
  DsSelectOption,
  DsInputComponent,
  DsCheckboxComponent
} from '../../../design-system';
import { TemplatePreviewComponent } from '../template-preview/template-preview.component';

@Component({
    selector: 'app-template-editor',
    standalone: true,
    templateUrl: './template-editor.component.html',
    styleUrls: ['./template-editor.component.css'],
    imports: [
      CommonModule,
      ReactiveFormsModule, 
      DsCardComponent, 
      DsButtonComponent, 
      DsIconComponent, 
      CdkDropList, 
      DsSelectComponent,
      DsInputComponent,
      DsCheckboxComponent,
      TemplatePreviewComponent
    ]
})
export class TemplateEditorComponent implements OnInit, OnDestroy {
  templateForm: FormGroup;
  templateId: number | null = null;
  isEditMode = false;
  isViewMode = false;
  
  readonly categories: DsSelectOption[] = [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utilitaire' },
    { value: 'AUTHENTICATION', label: 'Authentification' }
  ];

  readonly languages: DsSelectOption[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'es', label: 'Espagnol' },
    { value: 'de', label: 'Allemand' },
    { value: 'pt', label: 'Portugais' }
  ];

  readonly buttonTypes: DsSelectOption[] = [
    { value: 'QUICK_REPLY', label: 'Réponse rapide' },
    { value: 'URL', label: 'Lien externe' },
    { value: 'PHONE_NUMBER', label: 'Appel téléphonique' }
  ];

  readonly variableComponentTypes: DsSelectOption[] = [
    { value: 'HEADER', label: 'En-tête' },
    { value: 'BODY', label: 'Corps' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private templateService: WhatsAppTemplateApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      language: ['fr', Validators.required],
      category: ['MARKETING', Validators.required],
      description: [''],
      headerText: [''],
      bodyText: ['', Validators.required],
      footerText: [''],
      buttons: this.fb.array([]),
      variables: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const mode = this.route.snapshot.url[0].path;
    
    if (id) {
      this.templateId = parseInt(id, 10);
      this.isEditMode = mode === 'edit';
      this.isViewMode = mode === 'view';
      this.loadTemplate();
    }

    if (this.isViewMode) {
      this.templateForm.disable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplate(): void {
    if (!this.templateId) return;
    
    this.templateService.getTemplateById(this.templateId).subscribe((template: WhatsAppTemplateResponse) => {
      this.templateForm.patchValue({
        name: template.name,
        language: template.language,
        category: template.category,
        description: template.description
      });

      const header = template.components.find((c: any) => c.type === 'HEADER');
      if (header) this.templateForm.patchValue({ headerText: header.text });

      const body = template.components.find((c: any) => c.type === 'BODY');
      if (body) this.templateForm.patchValue({ bodyText: body.text });

      const footer = template.components.find((c: any) => c.type === 'FOOTER');
      if (footer) this.templateForm.patchValue({ footerText: footer.text });

      const buttonsComp = template.components.find((c: any) => c.type === 'BUTTONS');
      if (buttonsComp && buttonsComp.buttons) {
        buttonsComp.buttons.forEach((btn: any) => this.addButton(btn));
      }

      if (template.variables) {
        template.variables.forEach((v: any) => this.addVariable(v));
      }
    });
  }

  get buttons(): FormArray {
    return this.templateForm.get('buttons') as FormArray;
  }

  addButton(data?: any): void {
    const btn = this.fb.group({
      type: [data?.type || 'QUICK_REPLY', Validators.required],
      text: [data?.text || '', Validators.required],
      url: [data?.url || ''],
      phoneNumber: [data?.phoneNumber || '']
    });
    this.buttons.push(btn);
  }

  removeButton(index: number): void {
    this.buttons.removeAt(index);
  }

  get variables(): FormArray {
    return this.templateForm.get('variables') as FormArray;
  }

  addVariable(data?: any): void {
    const v = this.fb.group({
      variableName: [data?.variableName || '', Validators.required],
      componentType: [data?.componentType || 'BODY', Validators.required],
      position: [data?.position || this.variables.length + 1],
      exampleValue: [data?.exampleValue || ''],
      isRequired: [data?.isRequired ?? true]
    });
    this.variables.push(v);
  }

  removeVariable(index: number): void {
    this.variables.removeAt(index);
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) return;

    const request = this.buildRequest();
    
    if (this.isEditMode && this.templateId) {
      this.templateService.updateTemplate(this.templateId, request).subscribe(() => {
        this.router.navigate(['/workflow-admin/templates']);
      });
    } else {
      this.templateService.createTemplate(request).subscribe(() => {
        this.router.navigate(['/workflow-admin/templates']);
      });
    }
  }

  private buildRequest(): WhatsAppTemplateRequest {
    const formValue = this.templateForm.getRawValue();
    const components: any[] = [];

    if (formValue.headerText) {
      components.push({ type: 'HEADER', format: 'TEXT', text: formValue.headerText });
    }

    components.push({ type: 'BODY', text: formValue.bodyText });

    if (formValue.footerText) {
      components.push({ type: 'FOOTER', text: formValue.footerText });
    }

    if (formValue.buttons.length > 0) {
      components.push({ type: 'BUTTONS', buttons: formValue.buttons });
    }

    return {
      name: formValue.name,
      language: formValue.language,
      category: formValue.category,
      components,
      variables: formValue.variables,
      description: formValue.description
    };
  }

  cancel(): void {
    this.router.navigate(['/workflow-admin/templates']);
  }
}
