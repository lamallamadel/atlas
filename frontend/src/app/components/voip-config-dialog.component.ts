import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VoipService, VoipConfiguration } from '../services/voip.service';

@Component({
  selector: 'app-voip-config-dialog',
  template: `
    <h2 mat-dialog-title>Configuration VoIP</h2>
    <mat-dialog-content>
      <form #configForm="ngForm">
        <div class="form-field">
          <mat-slide-toggle 
            [(ngModel)]="config.enabled" 
            name="enabled"
            color="primary">
            Activer VoIP
          </mat-slide-toggle>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fournisseur</mat-label>
          <mat-select 
            [(ngModel)]="config.provider" 
            name="provider"
            [disabled]="!config.enabled"
            required>
            <mat-option [value]="null">-- Sélectionner --</mat-option>
            <mat-option value="twilio">Twilio</mat-option>
            <mat-option value="asterisk">Asterisk</mat-option>
            <mat-option value="custom">Personnalisé</mat-option>
          </mat-select>
          <mat-hint>Choisissez votre système de téléphonie</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>URL Click-to-Call</mat-label>
          <input 
            matInput 
            [(ngModel)]="config.clickToCallUrl" 
            name="url"
            [disabled]="!config.enabled"
            placeholder="tel:{{'{phone}'}}"
            [required]="config.provider === 'custom'">
          <mat-hint>
            Utilisez {{ '{' }}phone{{ '}' }} comme placeholder pour le numéro de téléphone
          </mat-hint>
        </mat-form-field>

        <mat-form-field 
          appearance="outline" 
          class="full-width"
          *ngIf="config.provider === 'twilio' || config.provider === 'asterisk'">
          <mat-label>Clé API</mat-label>
          <input 
            matInput 
            [(ngModel)]="config.apiKey" 
            name="apiKey"
            type="password"
            [disabled]="!config.enabled"
            [required]="config.provider === 'twilio' || config.provider === 'asterisk'">
          <mat-hint>Clé d'authentification pour votre fournisseur</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Format de numéro</mat-label>
          <mat-select 
            [(ngModel)]="config.phoneNumberFormat" 
            name="phoneFormat"
            [disabled]="!config.enabled">
            <mat-option [value]="undefined">Par défaut</mat-option>
            <mat-option value="international">International (+33...)</mat-option>
          </mat-select>
          <mat-hint>Format d'affichage et d'appel</mat-hint>
        </mat-form-field>

        <div class="config-examples">
          <h3>Exemples de configuration</h3>
          <div class="example-item">
            <strong>Mobile (iOS/Android):</strong>
            <code>tel:{{ '{' }}phone{{ '}' }}</code>
          </div>
          <div class="example-item">
            <strong>Skype:</strong>
            <code>skype:{{ '{' }}phone{{ '}' }}?call</code>
          </div>
          <div class="example-item">
            <strong>Zoom Phone:</strong>
            <code>zoommtg://zoom.us/call?number={{ '{' }}phone{{ '}' }}</code>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSave()"
        [disabled]="!configForm.valid || !config.enabled || !config.provider">
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
      padding: 24px;
    }

    .form-field {
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .config-examples {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .config-examples h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .example-item {
      margin-bottom: 8px;
      font-size: 13px;
    }

    .example-item strong {
      display: inline-block;
      min-width: 150px;
    }

    .example-item code {
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: unset;
        max-width: 100%;
      }
    }
  `]
})
export class VoipConfigDialogComponent {
  config: VoipConfiguration;

  constructor(
    private dialogRef: MatDialogRef<VoipConfigDialogComponent>,
    private voipService: VoipService,
    @Inject(MAT_DIALOG_DATA) public data: VoipConfiguration | null
  ) {
    if (data) {
      this.config = { ...data };
    } else {
      const currentConfig = this.voipService.getConfiguration();
      this.config = currentConfig || {
        enabled: false,
        provider: null
      };
    }
  }

  onSave(): void {
    this.voipService.setConfiguration(this.config);
    this.dialogRef.close(this.config);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
