import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DsInputComponent } from '../app/design-system/primitives/ds-input/ds-input.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';

const meta: Meta = {
  title: 'Design System/Recipes/Forms',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        FormsModule,
        DsInputComponent,
        DsButtonComponent,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Champs simples avec ds-input (tokens DS). Listes, cases et datepicker : Angular Material tant qu’il n’y a pas d’équivalent DS — thème aligné sur --ds-*.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const DsTextFields: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text); max-width: 520px;">
        <h2 style="margin-bottom: 24px;">ds-input</h2>
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <ds-input inputId="sb-fn" label="Nom complet" placeholder="Jean Dupont"></ds-input>
          <div>
            <ds-input inputId="sb-em" label="E-mail" type="email" placeholder="vous@exemple.com"></ds-input>
            <p style="margin: 6px 0 0; font-size: 12px; color: var(--ds-text-faint);">Nous ne partageons pas votre adresse.</p>
          </div>
          <ds-input inputId="sb-ph" label="Téléphone" type="tel" placeholder="+33 6 12 34 56 78" error="Veuillez saisir un numéro valide"></ds-input>
          <ds-input inputId="sb-dis" label="Lecture seule" placeholder="Non modifiable" [disabled]="true"></ds-input>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;color:var(--ds-text);">Description</label>
            <textarea rows="4" placeholder="Votre message…" style="width:100%;padding:10px 12px;border:1px solid var(--ds-border);border-radius:var(--ds-radius-md);font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box;background:var(--ds-surface);"></textarea>
            <p style="margin:6px 0 0;font-size:12px;color:var(--ds-text-faint);text-align:right;">0 / 500</p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const MaterialSelects: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text); max-width: 520px;">
        <h2 style="margin-bottom: 24px;">Sélecteurs (Material)</h2>
        <div style="display: flex; flex-direction: column; gap: 28px;">
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Type de bien</mat-label>
            <mat-select>
              <mat-option value="apartment">Appartement</mat-option>
              <mat-option value="house">Maison</mat-option>
              <mat-option value="villa">Villa</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Équipements</mat-label>
            <mat-select multiple>
              <mat-option value="parking">Parking</mat-option>
              <mat-option value="balcony">Balcon</mat-option>
              <mat-option value="garden">Jardin</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
    `,
  }),
};

export const CheckboxesAndRadios: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text); max-width: 520px;">
        <h2 style="margin-bottom: 24px;">Cases & radios (Material)</h2>
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 12px; font-size: 15px; color: var(--ds-text-muted);">Cases à cocher</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <mat-checkbox>J’accepte les conditions</mat-checkbox>
              <mat-checkbox checked>Recevoir la newsletter</mat-checkbox>
              <mat-checkbox disabled>Option désactivée</mat-checkbox>
            </div>
          </div>
          <div>
            <h3 style="margin-bottom: 12px; font-size: 15px; color: var(--ds-text-muted);">Boutons radio</h3>
            <mat-radio-group>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <mat-radio-button value="sale">À vendre</mat-radio-button>
                <mat-radio-button value="rent">À louer</mat-radio-button>
                <mat-radio-button value="both" checked>Les deux</mat-radio-button>
              </div>
            </mat-radio-group>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CompleteExample: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Formulaire mixte</h2>
        <div style="max-width: 600px; background: var(--ds-surface); padding: 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); border: 1px solid var(--ds-divider);">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">Demande d’information</h3>
          <div style="display: grid; gap: 18px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <ds-input inputId="sb-cf1" label="Prénom *" placeholder="Prénom"></ds-input>
              <ds-input inputId="sb-cf2" label="Nom *" placeholder="Nom"></ds-input>
            </div>
            <ds-input inputId="sb-cf3" label="E-mail *" type="email" placeholder="vous@exemple.com"></ds-input>
            <ds-input inputId="sb-cf4" label="Téléphone" type="tel" placeholder="+33 …"></ds-input>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Type de bien *</mat-label>
              <mat-select>
                <mat-option value="apartment">Appartement</mat-option>
                <mat-option value="house">Maison</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Message</mat-label>
              <textarea matInput rows="3" placeholder="Votre besoin…"></textarea>
            </mat-form-field>
            <mat-checkbox>J’accepte les conditions *</mat-checkbox>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
              <ds-button variant="ghost" size="md">Annuler</ds-button>
              <ds-button variant="marine" size="md">Envoyer</ds-button>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const AccessibilityNote: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text); max-width: 640px;">
        <h2 style="margin-bottom: 16px;">Accessibilité formulaires</h2>
        <ul style="line-height: 1.75; color: var(--ds-text-muted); padding-left: 20px;">
          <li>Libellé visible pour chaque champ (ds-input le fournit)</li>
          <li>Champ requis : indication textuelle + validation</li>
          <li>Erreurs reliées au champ (aria-describedby sur ds-input en cas d’erreur)</li>
          <li>Contraste des textes d’aide et d’erreur</li>
        </ul>
      </div>
    `,
  }),
};
