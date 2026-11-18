import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Champs simples avec ds-input (tokens DS). Tous les contrôles s’appuient désormais sur les primitives du Design System.',
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

export const CompleteExample: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Formulaire simple</h2>
        <div style="max-width: 600px; background: var(--ds-surface); padding: 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); border: 1px solid var(--ds-divider);">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">Demande d’information</h3>
          <div style="display: grid; gap: 18px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <ds-input inputId="sb-cf1" label="Prénom *" placeholder="Prénom"></ds-input>
              <ds-input inputId="sb-cf2" label="Nom *" placeholder="Nom"></ds-input>
            </div>
            <ds-input inputId="sb-cf3" label="E-mail *" type="email" placeholder="vous@exemple.com"></ds-input>
            <ds-input inputId="sb-cf4" label="Téléphone" type="tel" placeholder="+33 …"></ds-input>
            <div>
              <label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;color:var(--ds-text);">Message</label>
              <textarea rows="3" placeholder="Votre besoin…" style="width:100%;padding:10px 12px;border:1px solid var(--ds-border);border-radius:var(--ds-radius-md);font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box;background:var(--ds-surface);"></textarea>
            </div>
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
