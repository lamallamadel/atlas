import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ESignatureApiService } from '../services/esignature-api.service';
import { ContractTemplate, ContractTemplateCreate } from '../models/esignature.models';

@Component({
  selector: 'app-contract-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="contract-template-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Contract Templates</mat-card-title>
          <mat-card-subtitle>Manage PDF contract templates for electronic signatures</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="upload-section" *ngIf="!showForm">
            <button mat-raised-button color="primary" (click)="showForm = true">
              <mat-icon>add</mat-icon>
              Upload New Template
            </button>
          </div>

          <form [formGroup]="templateForm" *ngIf="showForm" (ngSubmit)="uploadTemplate()" class="template-form">
            <mat-form-field appearance="outline">
              <mat-label>Template Name</mat-label>
              <input matInput formControlName="templateName" required>
              <mat-error *ngIf="templateForm.get('templateName')?.hasError('required')">
                Template name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Template Type</mat-label>
              <mat-select formControlName="templateType" required>
                <mat-option value="MANDATE">Mandate Agreement</mat-option>
                <mat-option value="PURCHASE_AGREEMENT">Purchase Agreement</mat-option>
                <mat-option value="LISTING_AGREEMENT">Listing Agreement</mat-option>
                <mat-option value="LEASE_AGREEMENT">Lease Agreement</mat-option>
                <mat-option value="OTHER">Other</mat-option>
              </mat-select>
              <mat-error *ngIf="templateForm.get('templateType')?.hasError('required')">
                Template type is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <div class="file-upload">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf" hidden>
              <button mat-raised-button type="button" (click)="fileInput.click()">
                <mat-icon>upload_file</mat-icon>
                Choose PDF File
              </button>
              <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelUpload()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="!templateForm.valid || !selectedFile || uploading">
                {{ uploading ? 'Uploading...' : 'Upload Template' }}
              </button>
            </div>
          </form>

          <div class="templates-list" *ngIf="!showForm">
            <table mat-table [dataSource]="templates" class="templates-table">
              <ng-container matColumnDef="templateName">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let template">{{ template.templateName }}</td>
              </ng-container>

              <ng-container matColumnDef="templateType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let template">{{ template.templateType }}</td>
              </ng-container>

              <ng-container matColumnDef="fileName">
                <th mat-header-cell *matHeaderCellDef>File</th>
                <td mat-cell *matCellDef="let template">{{ template.fileName }}</td>
              </ng-container>

              <ng-container matColumnDef="fileSize">
                <th mat-header-cell *matHeaderCellDef>Size</th>
                <td mat-cell *matCellDef="let template">{{ formatFileSize(template.fileSize) }}</td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let template">{{ template.createdAt | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let template">
                  <button mat-icon-button color="warn" (click)="deleteTemplate(template.id)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="empty-state" *ngIf="templates.length === 0">
              <mat-icon>description</mat-icon>
              <p>No templates uploaded yet</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .contract-template-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .template-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 24px 0;
    }

    .file-upload {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
    }

    .file-name {
      color: #666;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .upload-section {
      margin: 24px 0;
    }

    .templates-table {
      width: 100%;
      margin-top: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class ContractTemplateComponent implements OnInit {
  templateForm: FormGroup;
  templates: ContractTemplate[] = [];
  selectedFile: File | null = null;
  uploading = false;
  showForm = false;
  displayedColumns = ['templateName', 'templateType', 'fileName', 'fileSize', 'createdAt', 'actions'];

  constructor(
    private fb: FormBuilder,
    private eSignatureService: ESignatureApiService,
    private snackBar: MatSnackBar
  ) {
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
        this.snackBar.open('Failed to load templates', 'Close', { duration: 3000 });
        console.error('Error loading templates:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Please select a PDF file', 'Close', { duration: 3000 });
    }
  }

  uploadTemplate(): void {
    if (this.templateForm.valid && this.selectedFile) {
      this.uploading = true;
      const template: ContractTemplateCreate = this.templateForm.value;

      this.eSignatureService.uploadTemplate(this.selectedFile, template).subscribe({
        next: () => {
          this.snackBar.open('Template uploaded successfully', 'Close', { duration: 3000 });
          this.cancelUpload();
          this.loadTemplates();
        },
        error: (error) => {
          this.snackBar.open('Failed to upload template', 'Close', { duration: 3000 });
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

  deleteTemplate(id: number | undefined): void {
    if (!id) return;

    if (confirm('Are you sure you want to delete this template?')) {
      this.eSignatureService.deleteTemplate(id).subscribe({
        next: () => {
          this.snackBar.open('Template deleted successfully', 'Close', { duration: 3000 });
          this.loadTemplates();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete template', 'Close', { duration: 3000 });
          console.error('Error deleting template:', error);
        }
      });
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }
}
