import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  DsCardComponent, 
  DsToastService, 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsEmptyStateComponent,
  DsSkeletonComponent,
  DsTableComponent,
  DsColumn,
  DsRowAction
} from '../design-system';
import { ESignatureApiService } from '../services/esignature-api.service';
import { ContractTemplate, ContractTemplateCreate } from '../models/esignature.models';

@Component({
  selector: 'app-contract-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsInputComponent,
    DsSelectComponent,
    DsEmptyStateComponent,
    DsSkeletonComponent,
    DsTableComponent,
    DsCellDirective
  ],
  template: `
    <div class="contract-template-container ds-form-stack" style="padding: 32px; max-width: var(--ds-content-wide); margin: 0 auto;">
      <header style="margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: var(--ds-marine); font-family: var(--ds-font-display);">Modèles de contrats</h1>
        <p style="margin: 8px 0 0; color: var(--ds-text-muted);">Gérez les modèles PDF pour les signatures électroniques</p>
      </header>

      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="ct-card-header" style="padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 class="ct-card-title" style="margin: 0; font-size: 18px; font-weight: 700; color: var(--ds-marine);">Bibliothèque</h3>
          @if (!showForm) {
            <ds-button variant="marine" size="md" (dsClick)="showForm = true">
              <ds-icon name="plus" [size]="20" style="margin-right: 8px;"></ds-icon>
              Nouveau modèle
            </ds-button>
          }
        </div>
        
        <div class="ct-card-body" style="padding: 24px;">
          @if (showForm) {
            <form [formGroup]="templateForm" (ngSubmit)="uploadTemplate()" class="template-form ds-form-stack" style="max-width: 600px;">
              <ds-input label="Nom du modèle" formControlName="templateName" required="true" placeholder="ex. Compromis de vente V1"></ds-input>
              
              <ds-select
                label="Type de modèle"
                [options]="templateTypeOptions"
                formControlName="templateType"
                required="true">
              </ds-select>
              
              <div class="ds-field">
                <label for="contract-template-field-70" class="ds-field__label">Description</label>
                <div class="ds-field__wrap">
                  <textarea id="contract-template-field-70" class="ds-field__input" formControlName="description" rows="3" style="height: auto; padding: 12px;"></textarea>
                </div>
              </div>

              <div class="file-upload-area" style="margin: 24px 0;">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf" hidden>
                <div style="display: flex; gap: 16px; align-items: center;">
                  <ds-button variant="ghost" size="md" type="button" (dsClick)="fileInput.click()">
                    <ds-icon name="folder" [size]="20" style="margin-right: 8px;"></ds-icon>
                    Choisir un fichier PDF
                  </ds-button>
                  @if (selectedFile) {
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ds-primary); font-weight: 600;">
                      <ds-icon name="check" [size]="16"></ds-icon>
                      {{ selectedFile.name }}
                    </div>
                  }
                </div>
              </div>

              <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 24px; border-top: 1px solid var(--ds-divider);">
                <ds-button variant="ghost" size="md" type="button" (dsClick)="cancelUpload()">Annuler</ds-button>
                <ds-button variant="marine" size="md" type="submit" [disabled]="!templateForm.valid || !selectedFile || uploading">
                  @if (uploading) {
                    <ds-skeleton variant="circle" width="20px" height="20px" [animate]="true" style="margin-right: 8px;"></ds-skeleton>
                  } @else {
                    <ds-icon name="upload" [size]="20" style="margin-right: 8px;"></ds-icon>
                  }
                  {{ uploading ? 'Envoi...' : 'Télécharger le modèle' }}
                </ds-button>
              </div>
            </form>
          }
    
          @if (!showForm) {
            <div class="templates-list">
              <ds-table
                [columns]="dsColumns"
                [data]="templates"
                [rowActions]="dsRowActions"
                (rowAction)="onRowAction($event)"
                emptyTitle="Aucun modèle de contrat"
                emptyDescription="Téléchargez votre premier modèle PDF pour commencer les signatures.">
                
                <ng-template dsCell="templateName" let-template>
                  <span style="font-weight: 600;">{{ template.templateName }}</span>
                </ng-template>

                <ng-template dsCell="fileName" let-template>
                  <span style="font-family: var(--ds-font-mono); font-size: 12px;">{{ template.fileName }}</span>
                </ng-template>

                <ng-template dsCell="fileSize" let-template>
                  {{ formatFileSize(template.fileSize) }}
                </ng-template>

                <ng-template dsCell="createdAt" let-template>
                  {{ template.createdAt | date:'short' }}
                </ng-template>
              </ds-table>
            </div>
          }
        </div>
      </ds-card>
    </div>
    `
})
export class ContractTemplateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eSignatureService = inject(ESignatureApiService);
  private toastService = inject(DsToastService);

  templateForm: FormGroup;
  templates: ContractTemplate[] = [];
  selectedFile: File | null = null;
  uploading = false;
  showForm = false;

  dsColumns: DsColumn<ContractTemplate>[] = [
    { key: 'templateName', header: 'Nom' },
    { key: 'templateType', header: 'Type' },
    { key: 'fileName',     header: 'Fichier' },
    { key: 'fileSize',     header: 'Taille' },
    { key: 'createdAt',    header: 'Créé le' }
  ];

  dsRowActions: DsRowAction<ContractTemplate>[] = [
    { icon: 'trash', label: 'Supprimer', action: 'delete', ariaLabel: 'Supprimer le modèle' }
  ];

  readonly templateTypeOptions: DsSelectOption[] = [
    { value: 'MANDATE', label: 'Mandat de vente/location' },
    { value: 'PURCHASE_AGREEMENT', label: 'Compromis de vente' },
    { value: 'LISTING_AGREEMENT', label: 'Mandat de recherche' },
    { value: 'LEASE_AGREEMENT', label: 'Contrat de bail' },
    { value: 'OTHER', label: 'Autre document' }
  ];

  constructor() {
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      templateType: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.eSignatureService.getActiveTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (error) => {
        this.toastService.error('Échec du chargement des modèles');
        console.error('Error loading templates:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.toastService.warning('Veuillez sélectionner un fichier PDF');
    }
  }

  uploadTemplate(): void {
    if (this.templateForm.valid && this.selectedFile) {
      this.uploading = true;
      const template: ContractTemplateCreate = this.templateForm.value;

      this.eSignatureService.uploadTemplate(this.selectedFile, template).subscribe({
        next: () => {
          this.toastService.success('Modèle téléchargé avec succès');
          this.cancelUpload();
          this.loadTemplates();
        },
        error: (error) => {
          this.toastService.error('Échec du téléchargement');
          console.error('Error uploading template:', error);
          this.uploading = false;
        }
      });
    }
  }

  cancelUpload(): void {
    this.showForm = false;
    this.templateForm.reset();
    this.selectedFile = null;
    this.uploading = false;
  }

  onRowAction(event: { action: string; row: ContractTemplate }): void {
    if (event.action === 'delete') {
      this.deleteTemplate(event.row.id);
    }
  }

  deleteTemplate(id: number | undefined): void {
    if (!id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      this.eSignatureService.deleteTemplate(id).subscribe({
        next: () => {
          this.toastService.success('Modèle supprimé avec succès');
          this.loadTemplates();
        },
        error: (error) => {
          this.toastService.error('Échec de la suppression');
          console.error('Error deleting template:', error);
        }
      });
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '—';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }
}
