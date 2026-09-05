import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { VoipService, VoipConfiguration } from '../services/voip.service';
import { FormsModule } from '@angular/forms';
import {
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent,
  DsButtonComponent,
  DsInputComponent,
  DsSelectComponent,
  DsSelectOption
} from '../design-system';

@Component({
    selector: 'app-voip-config-dialog',
    template: `
    <div class="ds-task-dialog">
      <ds-dialog-header (close)="onCancel()">
        <span>Configuration VoIP</span>
      </ds-dialog-header>

      <ds-dialog-content>
        <form #configForm="ngForm" class="ds-form-stack">
          <label class="voip-switch-field">
            <input type="checkbox" role="switch" class="voip-switch" [(ngModel)]="config.enabled" name="enabled">
            <span>Activer VoIP</span>
          </label>

          <ds-select
            label="Fournisseur"
            [options]="providerOptions"
            [(ngModel)]="config.provider"
            name="provider"
            [disabled]="!config.enabled">
          </ds-select>
          <p class="ds-field__hint">Choisissez votre système de téléphonie</p>

          <ds-input
            label="URL Click-to-Call"
            [(ngModel)]="config.clickToCallUrl"
            name="url"
            [disabled]="!config.enabled"
            placeholder="tel:{phone}">
          </ds-input>
          <p class="ds-field__hint">Utilisez {{ '{' }}phone{{ '}' }} comme placeholder pour le numéro de téléphone</p>

          @if (config.provider === 'twilio' || config.provider === 'asterisk') {
            <ds-input
              label="Clé API"
              type="password"
              [(ngModel)]="config.apiKey"
              name="apiKey"
              [disabled]="!config.enabled">
            </ds-input>
            <p class="ds-field__hint">Clé d'authentification pour votre fournisseur</p>
          }

          <ds-select
            label="Format de numéro"
            [options]="phoneFormatOptions"
            [(ngModel)]="config.phoneNumberFormat"
            name="phoneFormat"
            [disabled]="!config.enabled">
          </ds-select>
          <p class="ds-field__hint">Format d'affichage et d'appel</p>

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
      </ds-dialog-content>

      <ds-dialog-actions align="end">
        <ds-button variant="ghost" size="md" (dsClick)="onCancel()">Annuler</ds-button>
        <ds-button
          variant="marine"
          size="md"
          (dsClick)="onSave()"
          [disabled]="!config.enabled || !config.provider">
          Enregistrer
        </ds-button>
      </ds-dialog-actions>
    </div>
    `,
    styles: [`
    .voip-switch-field {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .voip-switch {
      appearance: none;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
      background: var(--ds-border);
      border-radius: 12px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .voip-switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .voip-switch:checked { background: var(--ds-marine); }
    .voip-switch:checked::after { transform: translateX(20px); }

    .config-examples {
      margin-top: 8px;
      padding: 16px;
      background: var(--ds-bg-subtle);
      border-radius: var(--ds-radius-md);
      border: 1px solid var(--ds-border);
    }

    .config-examples h3 {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--ds-text-muted);
    }

    .example-item {
      margin-bottom: 8px;
      font-size: 13px;
    }

    .example-item strong {
      display: inline-block;
      min-width: 150px;
      color: var(--ds-text);
    }

    .example-item code {
      background: var(--ds-surface);
      padding: 2px 6px;
      border-radius: var(--ds-radius-sm);
      font-family: var(--ds-font-mono);
      font-size: 12px;
      border: 1px solid var(--ds-border);
    }
  `],
    imports: [
      FormsModule,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent,
      DsButtonComponent,
      DsInputComponent,
      DsSelectComponent
    ]
})
export class VoipConfigDialogComponent {
  config: VoipConfiguration;

  readonly providerOptions: DsSelectOption[] = [
    { value: null as any, label: '-- Sélectionner --' },
    { value: 'twilio', label: 'Twilio' },
    { value: 'asterisk', label: 'Asterisk' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  readonly phoneFormatOptions: DsSelectOption[] = [
    { value: undefined as any, label: 'Par défaut' },
    { value: 'international', label: 'International (+33...)' }
  ];

  constructor(
    private dialogRef: DialogRef<any>,
    private voipService: VoipService,
    @Inject(DIALOG_DATA) public data: VoipConfiguration | null
  ) {
    if (data) {
      this.config = { ...data };
    } else {
      const currentConfig = this.voipService.getConfiguration();
      this.config = currentConfig || { enabled: false, provider: null };
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
