import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';

/** Recipes chargement : préférer `ds-skeleton` et `ds-button [loading]` (phase 2.7 du plan DS). */
const meta: Meta = {
  title: 'Design System/Recipes/Loading States',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, DsButtonComponent, DsSkeletonComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Retours visuels pendant les opérations async : skeletons DS, boutons en chargement, indicateurs légers. Éviter `MatProgressSpinner` en pleine page lorsqu’un skeleton préserve la mise en page.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Spinners: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Indicateurs circulaires (légers)</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Tailles</h3>
            <div style="display: flex; gap: 32px; align-items: center;">
              <div style="text-align: center;">
                <div class="sb-spin sb-spin--sm" aria-hidden="true"></div>
                <div style="margin-top: 12px; font-size: 12px; color: var(--ds-text-muted);">24px</div>
              </div>
              <div style="text-align: center;">
                <div class="sb-spin sb-spin--md" aria-hidden="true"></div>
                <div style="margin-top: 12px; font-size: 12px; color: var(--ds-text-muted);">32px</div>
              </div>
              <div style="text-align: center;">
                <div class="sb-spin sb-spin--lg" aria-hidden="true"></div>
                <div style="margin-top: 12px; font-size: 12px; color: var(--ds-text-muted);">48px</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Bouton — utiliser <code style="font-size:13px">ds-button</code></h3>
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <ds-button variant="marine" size="md" [loading]="true">Envoi…</ds-button>
              <ds-button variant="ghost" size="md" [loading]="true">Traitement…</ds-button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Inline</h3>
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--ds-surface-2); border-radius: var(--ds-radius-lg); border: 1px solid var(--ds-divider);">
              <div class="sb-spin sb-spin--sm" aria-hidden="true"></div>
              <span style="color: var(--ds-text-muted); font-size: 14px;">Chargement des données…</span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Zone dense (préférer skeleton ci‑dessous)</h3>
            <div style="position: relative; height: 280px; background: var(--ds-bg); border-radius: var(--ds-radius-xl); border: 1px dashed var(--ds-divider); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
              <div class="sb-spin sb-spin--lg" aria-hidden="true"></div>
              <div style="color: var(--ds-text-muted); font-size: 15px;">Chargement de l’application…</div>
            </div>
          </div>
        </div>

        <style>
          .sb-spin {
            border-radius: 50%;
            border: 2px solid var(--ds-surface-offset);
            border-top-color: var(--ds-marine);
            animation: sb-spin-rotate 0.75s linear infinite;
            margin: 0 auto;
          }
          .sb-spin--sm { width: 24px; height: 24px; }
          .sb-spin--md { width: 32px; height: 32px; border-width: 3px; }
          .sb-spin--lg { width: 48px; height: 48px; border-width: 4px; }
          @keyframes sb-spin-rotate {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `,
  }),
};

export const SkeletonLoaders: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Skeletons (<code style="font-size:13px">ds-skeleton</code>)</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Carte</h3>
            <div style="max-width: 400px; background: var(--ds-surface); padding: 20px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); border: 1px solid var(--ds-divider);">
              <ds-skeleton variant="card" height="200px" width="100%" style="display:block;margin-bottom:16px"></ds-skeleton>
              <ds-skeleton variant="heading" width="60%" style="display:block;margin-bottom:12px"></ds-skeleton>
              <ds-skeleton variant="text" width="100%" style="display:block;margin-bottom:8px"></ds-skeleton>
              <ds-skeleton variant="text" width="80%" style="display:block"></ds-skeleton>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Liste</h3>
            <div style="max-width: 560px; background: var(--ds-surface); border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); border: 1px solid var(--ds-divider); overflow: hidden;">
              @for (row of [1,2,3]; track row) {
                <div style="padding: 16px; border-bottom: 1px solid var(--ds-divider); display: flex; align-items: center; gap: 16px;">
                  <ds-skeleton variant="circle" width="48px" height="48px" style="flex-shrink:0"></ds-skeleton>
                  <div style="flex: 1;">
                    <ds-skeleton variant="text" width="45%" style="display:block;margin-bottom:8px"></ds-skeleton>
                    <ds-skeleton variant="text" width="70%" style="display:block"></ds-skeleton>
                  </div>
                </div>
              }
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Texte</h3>
            <div style="max-width: 560px; background: var(--ds-surface); padding: 24px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); border: 1px solid var(--ds-divider);">
              <ds-skeleton variant="heading" width="40%" style="display:block;margin-bottom:16px"></ds-skeleton>
              @for (l of [1,2,3,4]; track l) {
                <ds-skeleton variant="text" [width]="l === 4 ? '70%' : '100%'" style="display:block;margin-bottom:8px"></ds-skeleton>
              }
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ProgressBars: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Barres de progression</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Déterminée</h3>
            <div style="max-width: 500px;">
              <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--ds-text-muted);">Envoi fichier</span>
                  <span style="font-size: 14px; font-weight: 600; color: var(--ds-marine);">65%</span>
                </div>
                <div style="height: 8px; background: var(--ds-surface-offset); border-radius: var(--ds-radius-pill); overflow: hidden;">
                  <div style="width: 65%; height: 100%; background: var(--ds-marine); border-radius: var(--ds-radius-pill); transition: width 0.3s ease;"></div>
                </div>
              </div>

              <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--ds-text-muted);">Terminé</span>
                  <span style="font-size: 14px; font-weight: 600; color: var(--ds-success);">100%</span>
                </div>
                <div style="height: 8px; background: var(--ds-surface-offset); border-radius: var(--ds-radius-pill); overflow: hidden;">
                  <div style="width: 100%; height: 100%; background: var(--ds-success); border-radius: var(--ds-radius-pill);"></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Indéterminée (CSS)</h3>
            <div style="max-width: 500px;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 14px; color: var(--ds-text-muted);">Chargement…</span>
              </div>
              <div class="sb-indet-track">
                <div class="sb-indet-bar"></div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--ds-text-muted); font-size: 15px;">Étapes</h3>
            <div style="max-width: 600px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--ds-success); color: var(--ds-text-inverse); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 700;">✓</div>
                  <div style="font-size: 12px; color: var(--ds-text-muted);">Étape 1</div>
                </div>
                <div style="flex: 1; height: 2px; background: var(--ds-success); margin: 0 8px;"></div>
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--ds-marine); color: var(--ds-text-inverse); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 700;">2</div>
                  <div style="font-size: 12px; color: var(--ds-text); font-weight: 600;">Étape 2</div>
                </div>
                <div style="flex: 1; height: 2px; background: var(--ds-divider); margin: 0 8px;"></div>
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--ds-surface-offset); color: var(--ds-text-faint); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 700;">3</div>
                  <div style="font-size: 12px; color: var(--ds-text-faint);">Étape 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>
          .sb-indet-track {
            height: 8px;
            background: var(--ds-surface-offset);
            border-radius: var(--ds-radius-pill);
            overflow: hidden;
            position: relative;
          }
          .sb-indet-bar {
            position: absolute;
            height: 100%;
            width: 35%;
            background: var(--ds-marine);
            border-radius: var(--ds-radius-pill);
            animation: sb-indet-slide 1.2s ease-in-out infinite;
          }
          @keyframes sb-indet-slide {
            0% { left: -35%; }
            100% { left: 100%; }
          }
        </style>
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
              <li>Afficher un retour dès ~200&nbsp;ms</li>
              <li>Skeleton pour les zones riches en contenu</li>
              <li><code>ds-button</code> avec <code>[loading]</code> pour les actions</li>
              <li>Désactiver les interactions pendant le chargement</li>
              <li><code>aria-busy</code> sur le conteneur concerné lorsque pertinent</li>
            </ul>
          </div>

          <div style="background: color-mix(in srgb, var(--ds-error) 8%, transparent); padding: 20px; border-radius: var(--ds-radius-lg); border-left: 4px solid var(--ds-error);">
            <h3 style="margin-top: 0; color: var(--ds-error); font-size: 16px;">À éviter</h3>
            <ul style="line-height: 1.8; color: var(--ds-text-muted); margin: 0;">
              <li>Spinner pleine page si un skeleton préserve la mise en page</li>
              <li>Multiples spinners concurrents sur le même écran</li>
              <li>Oublier de lever l’état chargement en cas d’erreur</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  }),
};
