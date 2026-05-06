import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

const meta: Meta = {
  title: 'Guidelines/Do and Don\'t',
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
          'Exemples visuels de bonnes et mauvaises pratiques (composants DS, tokens --ds-*).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ButtonUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 32px;">Boutons</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20" style="color:var(--ds-success)"></ds-icon>
              À faire : texte action clair
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; gap: 12px; flex-wrap: wrap;">
              <ds-button variant="marine" size="md">Enregistrer les modifications</ds-button>
              <ds-button variant="marine" size="md">Nouveau dossier</ds-button>
            </div>
            <p style="margin: 12px 0 0; font-size: 14px; color: var(--ds-text-muted);">Libellé explicite sur l’action réalisée.</p>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20" style="color:var(--ds-error)"></ds-icon>
              À éviter : texte vague
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; gap: 12px; flex-wrap: wrap;">
              <ds-button variant="marine" size="md">OK</ds-button>
              <ds-button variant="marine" size="md">Cliquez ici</ds-button>
            </div>
            <p style="margin: 12px 0 0; font-size: 14px; color: var(--ds-text-muted);">« OK » ou « Cliquez ici » sans contexte.</p>
          </div>

          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20" style="color:var(--ds-success)"></ds-icon>
              À faire : bouton icône avec aria-label
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; gap: 8px;">
              <ds-button variant="icon" size="md" ariaLabel="Ajouter aux favoris"><ds-icon name="star" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md" ariaLabel="Partager par e-mail"><ds-icon name="mail" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md" ariaLabel="Supprimer"><ds-icon name="trash" [size]="20"></ds-icon></ds-button>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20" style="color:var(--ds-error)"></ds-icon>
              À éviter : icône sans nom accessible
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; gap: 8px;">
              <ds-button variant="icon" size="md"><ds-icon name="star" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md"><ds-icon name="mail" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md"><ds-icon name="trash" [size]="20"></ds-icon></ds-button>
            </div>
            <p style="margin: 12px 0 0; font-size: 14px; color: var(--ds-text-muted);">Sans aria-label, les lecteurs d’écran n’ont pas de contexte.</p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ColorUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 32px;">Couleur</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Couleur + icône + texte
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--ds-success-hl); border-radius: var(--ds-radius-md);">
                <ds-icon name="check" [size]="20" style="color:var(--ds-success)"></ds-icon>
                <span style="color: var(--ds-success); font-weight: 600;">Actif</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: color-mix(in srgb, var(--ds-error) 10%, transparent); border-radius: var(--ds-radius-md);">
                <ds-icon name="close" [size]="20" style="color:var(--ds-error)"></ds-icon>
                <span style="color: var(--ds-error); font-weight: 600;">Inactif</span>
              </div>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Couleur seule
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md); display: flex; flex-direction: column; gap: 12px;">
              <div style="padding: 12px; background: var(--ds-success-hl); border-radius: var(--ds-radius-md); text-align: center;"><span style="font-weight: 600;">Actif</span></div>
              <div style="padding: 12px; background: color-mix(in srgb, var(--ds-error) 12%, transparent); border-radius: var(--ds-radius-md); text-align: center;"><span style="font-weight: 600;">Inactif</span></div>
            </div>
            <p style="margin: 12px 0 0; font-size: 14px; color: var(--ds-text-muted);">Ne pas reposer uniquement sur la couleur (daltonisme).</p>
          </div>

          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Contraste élevé
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <p style="color: var(--ds-text); font-size: 16px; margin: 0;">Texte principal sur surface (WCAG AA visé).</p>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Contraste faible
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <p style="color: var(--ds-text-faint); font-size: 16px; margin: 0;">Texte trop pâle sur fond clair.</p>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const FormUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 32px;">Formulaires</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Libellé visible
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--ds-text);">E-mail *</label>
              <input type="email" placeholder="vous@exemple.com" style="width: 100%; padding: 10px 12px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font-size: 14px; box-sizing: border-box;">
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Placeholder comme seul libellé
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <input type="email" placeholder="E-mail *" style="width: 100%; padding: 10px 12px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); font-size: 14px; box-sizing: border-box;">
            </div>
          </div>

          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Message d’erreur précis
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <label style="display: block; font-weight: 600; margin-bottom: 8px;">Mot de passe *</label>
              <input type="password" value="123" style="width: 100%; padding: 10px 12px; border: 2px solid var(--ds-error); border-radius: var(--ds-radius-md); font-size: 14px; box-sizing: border-box;">
              <div style="display: flex; align-items: flex-start; gap: 6px; margin-top: 8px; color: var(--ds-error); font-size: 13px;">
                <ds-icon name="alert-circle" [size]="16" style="flex-shrink:0;margin-top:2px;"></ds-icon>
                <span>Au moins 8 caractères requis</span>
              </div>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Erreur vague
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <label style="display: block; font-weight: 600; margin-bottom: 8px;">Mot de passe *</label>
              <input type="password" value="123" style="width: 100%; padding: 10px 12px; border: 2px solid var(--ds-error); border-radius: var(--ds-radius-md); font-size: 14px; box-sizing: border-box;">
              <div style="margin-top: 8px; color: var(--ds-error); font-size: 13px;">Saisie invalide</div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const LayoutUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 32px;">Mise en page</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Espacement régulier (échelle --ds-space-*)
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md);">Bloc 1</div>
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md);">Bloc 2</div>
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md);">Bloc 3</div>
              </div>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Espacements arbitraires
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <div style="display: flex; flex-direction: column;">
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md); margin-bottom: 7px;">Bloc 1</div>
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md); margin-bottom: 23px;">Bloc 2</div>
                <div style="padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-md);">Bloc 3</div>
              </div>
            </div>
          </div>

          <div style="background: var(--ds-success-hl); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-success); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="check" [size]="20"></ds-icon>
              Cibles tactiles ≥ 44px
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <div style="display: flex; gap: 12px;">
                <ds-button variant="icon" size="md" ariaLabel="Favori" style="min-width:44px;min-height:44px;"><ds-icon name="star" [size]="20"></ds-icon></ds-button>
                <ds-button variant="icon" size="md" ariaLabel="Partager" style="min-width:44px;min-height:44px;"><ds-icon name="mail" [size]="20"></ds-icon></ds-button>
              </div>
            </div>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 24px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--ds-error); display: flex; align-items: center; gap: 8px; font-size: 16px;">
              <ds-icon name="close" [size]="20"></ds-icon>
              Cibles trop petites
            </h3>
            <div style="background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-md);">
              <div style="display: flex; gap: 4px;">
                <button type="button" style="width: 24px; height: 24px; padding: 0; border: none; background: var(--ds-marine); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <ds-icon name="star" [size]="16" style="color:var(--ds-text-inverse)"></ds-icon>
                </button>
                <button type="button" style="width: 24px; height: 24px; padding: 0; border: none; background: var(--ds-marine); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <ds-icon name="mail" [size]="16" style="color:var(--ds-text-inverse)"></ds-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
