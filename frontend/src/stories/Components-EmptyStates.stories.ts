import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

/** Recipes alignées DS (`ds-empty-state`, `ds-button`, `ds-icon`, tokens `--ds-*`). */
const meta: Meta = {
  title: 'Design System/Recipes/Empty States',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, DsButtonComponent, DsEmptyStateComponent, DsIconComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Patterns d’états vides avec le design system Atlasia. Préférer `ds-empty-state` pour le flux standard (titre, description, un CTA). Composer `ds-icon` + `ds-button` pour plusieurs actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const EmptyStateTypes: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Types d’états vides</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Pas encore de données</h3>
            <div style="background: var(--ds-surface); padding: 48px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 520px; border: 1px solid var(--ds-divider);">
              <div style="width: 80px; height: 80px; background: var(--ds-marine-hl); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <ds-icon name="folder" [size]="24" style="color:var(--ds-marine)"></ds-icon>
              </div>
              <ds-empty-state
                title="Aucun élément"
                description="Vous n’avez encore rien créé. Ajoutez un premier élément pour démarrer."
                ctaLabel="Créer le premier élément">
              </ds-empty-state>
            </div>
            <p style="margin-top: 12px; font-size: 14px; color: var(--ds-text-muted);">Quand l’utilisateur n’a pas encore créé de contenu.</p>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Aucun résultat de recherche</h3>
            <div style="background: var(--ds-surface); padding: 48px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 520px; border: 1px solid var(--ds-divider);">
              <div style="width: 80px; height: 80px; background: var(--ds-marine-hl); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <ds-icon name="search" [size]="24" style="color:var(--ds-marine)"></ds-icon>
              </div>
              <h3 style="margin: 0 0 12px; font-size: 20px;">Aucun résultat</h3>
              <p style="margin: 0 0 24px; color: var(--ds-text-muted); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                Rien ne correspond à « <strong>searchterm</strong> ». Essayez d’élargir la recherche ou de réinitialiser les filtres.
              </p>
              <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <ds-button variant="ghost" size="md">Réinitialiser les filtres</ds-button>
                <ds-button variant="marine" size="md">Voir tout</ds-button>
              </div>
            </div>
            <p style="margin-top: 12px; font-size: 14px; color: var(--ds-text-muted);">Recherche ou filtres sans résultat.</p>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Erreur de chargement</h3>
            <div style="background: var(--ds-surface); padding: 48px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 520px; border: 1px solid var(--ds-divider);">
              <div style="width: 80px; height: 80px; background: color-mix(in srgb, var(--ds-error) 12%, transparent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <ds-icon name="alert-circle" [size]="24" style="color:var(--ds-error)"></ds-icon>
              </div>
              <h3 style="margin: 0 0 12px; font-size: 20px;">Impossible de charger</h3>
              <p style="margin: 0 0 24px; color: var(--ds-text-muted); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                Les données n’ont pas pu être récupérées. Réessayez ou contactez le support si le problème continue.
              </p>
              <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <ds-button variant="ghost" size="md">Contacter le support</ds-button>
                <ds-button variant="marine" size="md">Réessayer</ds-button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Accès refusé</h3>
            <div style="background: var(--ds-surface); padding: 48px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 520px; border: 1px solid var(--ds-divider);">
              <div style="width: 80px; height: 80px; background: color-mix(in srgb, var(--ds-warning) 14%, transparent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <ds-icon name="lock" [size]="24" style="color:var(--ds-warning)"></ds-icon>
              </div>
              <ds-empty-state
                title="Accès refusé"
                description="Vous n’avez pas la permission de voir ce contenu. Demandez l’accès à votre administrateur."
                ctaLabel="Demander l’accès">
              </ds-empty-state>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Terminé</h3>
            <div style="background: var(--ds-surface); padding: 48px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 520px; border: 1px solid var(--ds-divider);">
              <div style="width: 80px; height: 80px; background: var(--ds-success-hl); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <ds-icon name="check-circle" [size]="44" style="color:var(--ds-success)"></ds-icon>
              </div>
              <ds-empty-state
                title="Tout est à jour"
                description="Vous avez terminé toutes les tâches. Vous pouvez souffler ou en lancer de nouvelles."
                ctaLabel="Nouvelle tâche">
              </ds-empty-state>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CompactEmptyStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">États vides compacts</h2>

        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Inline</h3>
            <div style="background: var(--ds-surface); padding: 28px; border-radius: var(--ds-radius-lg); border: 1px solid var(--ds-divider); text-align: center;">
              <ds-icon name="folder" [size]="24" style="color:var(--ds-text-faint);margin-bottom:12px;display:inline-flex;"></ds-icon>
              <div style="font-size: 14px; color: var(--ds-text-muted);">Aucun fichier dans ce dossier</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Liste</h3>
            <div style="background: var(--ds-surface); border-radius: var(--ds-radius-lg); border: 1px solid var(--ds-divider); overflow: hidden;">
              <div style="padding: 12px 16px; background: var(--ds-surface-2); border-bottom: 1px solid var(--ds-divider); font-weight: 600; color: var(--ds-text); font-size: 14px;">
                Activité récente
              </div>
              <div style="padding: 40px 28px; text-align: center;">
                <ds-icon name="calendar" [size]="24" style="color:var(--ds-border);margin-bottom:12px;display:inline-flex;"></ds-icon>
                <div style="color: var(--ds-text-muted); font-size: 14px; margin-bottom: 8px;">Aucune activité récente</div>
                <div style="color: var(--ds-text-faint); font-size: 13px;">L’activité apparaîtra ici lorsque vous utiliserez l’application.</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Carte</h3>
            <div style="background: var(--ds-surface); padding: 24px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; max-width: 320px; border: 1px solid var(--ds-divider);">
              <ds-icon name="mail" [size]="24" style="color:var(--ds-border);margin-bottom:16px;display:inline-flex;"></ds-icon>
              <div style="font-weight: 600; margin-bottom: 8px;">Aucune notification</div>
              <div style="font-size: 14px; color: var(--ds-text-muted); line-height: 1.5;">Vous êtes à jour.</div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const BestPractices: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Bonnes pratiques</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--ds-success-hl); padding: 20px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-success);">
            <h3 style="margin-top: 0; color: var(--ds-success); font-size: 16px;">À faire</h3>
            <ul style="line-height: 1.8; color: var(--ds-text-muted); margin: 0;">
              <li>Message clair et bienveillant</li>
              <li>Icône ou illustration pertinente (composant ds-icon)</li>
              <li>Action principale visible (ds-button marine ou copper)</li>
              <li>Expliquer pourquoi l’état est vide</li>
              <li>Ton adapté au contexte (erreur vs vide normal)</li>
            </ul>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 20px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; color: var(--ds-error); font-size: 16px;">À éviter</h3>
            <ul style="line-height: 1.8; color: var(--ds-text-muted); margin: 0;">
              <li>Blâmer l’utilisateur</li>
              <li>Écran vide sans explication</li>
              <li>Jargon technique ou codes d’erreur seuls</li>
              <li>Trop de boutons concurrents</li>
            </ul>
          </div>

          <div style="background: var(--ds-marine-hl); padding: 20px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-marine);">
            <h3 style="margin-top: 0; color: var(--ds-marine); font-size: 16px;">Contenu</h3>
            <div style="display: grid; gap: 16px; color: var(--ds-text-muted); font-size: 14px;">
              <div><strong style="color:var(--ds-text)">Titre</strong> — court (2–5 mots).</div>
              <div><strong style="color:var(--ds-text)">Description</strong> — 1–2 phrases, action suivante.</div>
              <div><strong style="color:var(--ds-text)">CTA</strong> — verbe d’action (« Créer… », « Réessayer »).</div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
