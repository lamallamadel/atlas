import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

/** Maquettes statiques de dialogues (contenu DS). À l’exécution : MatDialog ou équivalent avec piège de focus. */
const meta: Meta = {
  title: 'Design System/Recipes/Dialogs',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, DsButtonComponent, DsIconComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Patterns visuels pour modales : icônes ds-icon, actions ds-button. Le code métier utilise en général MatDialog (focus trap, ESC) ; le contenu peut reprendre ces blocs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Types: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Types</h2>
        <div style="display:grid;gap:40px;">
          <div>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Confirmation destructive</h3>
            <div style="max-width: 400px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-xl); padding: 24px; border: 1px solid var(--ds-divider);">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: color-mix(in srgb, var(--ds-error) 12%, transparent); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <ds-icon name="alert-circle" [size]="24" style="color:var(--ds-error)"></ds-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px; font-size: 18px;">Supprimer l’élément ?</h4>
                  <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.6;">
                    Action irréversible. Les données associées seront perdues.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <ds-button variant="ghost" size="md">Annuler</ds-button>
                <ds-button variant="danger" size="md">Supprimer</ds-button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Information</h3>
            <div style="max-width: 400px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-xl); padding: 24px; border: 1px solid var(--ds-divider);">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: var(--ds-marine-hl); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <ds-icon name="info" [size]="24" style="color:var(--ds-marine)"></ds-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px; font-size: 18px;">Nouveautés</h4>
                  <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.6;">
                    Consultez le journal des modifications pour les dernières améliorations.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <ds-button variant="ghost" size="md">En savoir plus</ds-button>
                <ds-button variant="marine" size="md">Compris</ds-button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Succès</h3>
            <div style="max-width: 400px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-xl); padding: 24px; border: 1px solid var(--ds-divider);">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: var(--ds-success-hl); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <ds-icon name="check" [size]="24" style="color:var(--ds-success)"></ds-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px; font-size: 18px;">Enregistré</h4>
                  <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.6;">
                    Vos modifications ont bien été prises en compte.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <ds-button variant="ghost" size="md">Continuer</ds-button>
                <ds-button variant="marine" size="md">Fermer</ds-button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Formulaire</h3>
            <div style="max-width: 500px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-xl); border: 1px solid var(--ds-divider); overflow: hidden;">
              <div style="padding: 24px; border-bottom: 1px solid var(--ds-divider);">
                <h4 style="margin: 0; font-size: 20px;">Ajouter</h4>
              </div>
              <div style="padding: 24px;">
                <label style="display: block; margin-bottom: 8px; color: var(--ds-text); font-weight: 600; font-size: 14px;">Nom</label>
                <input type="text" placeholder="Nom" style="width: 100%; padding: 10px 12px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font-size: 14px; box-sizing: border-box; background: var(--ds-surface);" />
                <label style="display: block; margin: 16px 0 8px; color: var(--ds-text); font-weight: 600; font-size: 14px;">Description</label>
                <textarea rows="3" placeholder="Description" style="width: 100%; padding: 10px 12px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font-size: 14px; font-family: inherit; resize: vertical; box-sizing: border-box; background: var(--ds-surface);"></textarea>
              </div>
              <div style="padding: 16px 24px; background: var(--ds-surface-2); border-top: 1px solid var(--ds-divider); display: flex; gap: 12px; justify-content: flex-end;">
                <ds-button variant="ghost" size="md">Annuler</ds-button>
                <ds-button variant="marine" size="md">Enregistrer</ds-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Largeurs cibles</h2>
        <div style="display:grid;gap:24px;">
          <div style="max-width: 320px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-lg); padding: 24px; border: 1px solid var(--ds-divider);">
            <h4 style="margin: 0 0 12px; font-size: 17px;">Petit (~320px)</h4>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); font-size: 14px;">Confirmation courte.</p>
            <div style="display:flex;gap:12px;justify-content:flex-end;">
              <ds-button variant="ghost" size="sm">OK</ds-button>
            </div>
          </div>
          <div style="max-width: 480px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-lg); padding: 24px; border: 1px solid var(--ds-divider);">
            <h4 style="margin: 0 0 12px; font-size: 17px;">Moyen (~480px)</h4>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); font-size: 14px;">Formulaires et textes plus longs — taille la plus courante.</p>
            <div style="display:flex;gap:12px;justify-content:flex-end;">
              <ds-button variant="ghost" size="md">Annuler</ds-button>
              <ds-button variant="marine" size="md">Valider</ds-button>
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
        <h2 style="margin-bottom: 16px;">Accessibilité</h2>
        <ul style="line-height:1.7;color:var(--ds-text-muted);padding-left:20px;">
          <li>Rôle dialog, titre relié avec aria-labelledby</li>
          <li>Piège de focus dans la modale, retour au déclencheur à la fermeture</li>
          <li>Fermeture Échap</li>
          <li>Ne pas imbriquer plusieurs modales</li>
        </ul>
      </div>
    `,
  }),
};
