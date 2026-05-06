import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

const meta: Meta = {
  title: 'Design System/Recipes/Illustrations',
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
          'Blocs illustratifs (icônes DS + texte + CTA). Préférer ds-empty-state pour les cas standard ; ce fichier montre des compositions marketing / onboarding.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const panel =
  'background: var(--ds-surface); padding: 40px 28px; border-radius: var(--ds-radius-xl); box-shadow: var(--ds-shadow-md); text-align: center; border: 1px solid var(--ds-divider);';
const iconWrap =
  'width: 112px; height: 112px; margin: 0 auto 20px; background: var(--ds-surface-2); border-radius: 50%; display: flex; align-items: center; justify-content: center;';

export const EmptyAndErrors: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Vides & erreurs</h2>
        <div style="display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <div style="${panel}">
            <div style="${iconWrap}"><ds-icon name="folder" [size]="24" style="color:var(--ds-text-faint)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Aucun dossier</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">Créez votre premier dossier pour commencer.</p>
            <ds-button variant="marine" size="md">Nouveau dossier</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}"><ds-icon name="search" [size]="24" style="color:var(--ds-text-faint)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Aucun résultat</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">Élargissez la recherche ou réinitialisez les filtres.</p>
            <ds-button variant="ghost" size="md">Réinitialiser</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-marine-hl);"><ds-icon name="mail" [size]="24" style="color:var(--ds-marine)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Aucun message</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">Votre boîte est vide.</p>
            <ds-button variant="ghost" size="md">Actualiser</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}background:color-mix(in srgb,var(--ds-error) 10%,transparent);"><ds-icon name="alert-circle" [size]="24" style="color:var(--ds-error)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Échec du chargement</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">Réessayez dans un instant.</p>
            <ds-button variant="danger" size="md">Réessayer</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}"><ds-icon name="map" [size]="24" style="color:var(--ds-warning)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Hors ligne</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">Vérifiez la connexion réseau.</p>
            <ds-button variant="marine" size="md">Réessayer</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}"><ds-icon name="close" [size]="24" style="color:var(--ds-text-faint)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Page introuvable</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); line-height: 1.55; font-size: 14px;">L’URL demandée n’existe pas.</p>
            <ds-button variant="marine" size="md">Accueil</ds-button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Success: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Succès</h2>
        <div style="display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-success-hl);"><ds-icon name="check" [size]="24" style="color:var(--ds-success)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Enregistré</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); font-size: 14px;">Vos changements sont sauvegardés.</p>
            <ds-button variant="marine" size="md">Continuer</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-marine-hl);"><ds-icon name="mail" [size]="24" style="color:var(--ds-marine)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">E-mail envoyé</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); font-size: 14px;">Consultez votre boîte de réception.</p>
            <ds-button variant="ghost" size="md">OK</ds-button>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-success-hl);"><ds-icon name="upload" [size]="24" style="color:var(--ds-success)"></ds-icon></div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Import terminé</h3>
            <p style="margin: 0 0 20px; color: var(--ds-text-muted); font-size: 14px;">Les fichiers sont prêts.</p>
            <ds-button variant="ghost" size="md">Voir</ds-button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Loading: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Chargement (marketing)</h2>
        <p style="color:var(--ds-text-muted);font-size:14px;margin-bottom:20px;">En production préférer ds-skeleton (recipe Loading States).</p>
        <div style="display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-marine-hl);">
              <div class="sb-ill-spin" aria-hidden="true"></div>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Chargement…</h3>
            <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px;">Merci de patienter.</p>
          </div>
          <div style="${panel}">
            <div style="${iconWrap}background:var(--ds-primary-subtle);">
              <ds-icon name="tasks" [size]="24" class="sb-ill-pulse" style="color:var(--ds-primary)"></ds-icon>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 18px;">Traitement…</h3>
            <div style="margin-top:12px;height:4px;background:var(--ds-surface-offset);border-radius:2px;overflow:hidden;">
              <div class="sb-ill-bar"></div>
            </div>
          </div>
        </div>
        <style>
          .sb-ill-spin { width: 28px; height: 28px; border-radius: 50%; border: 3px solid var(--ds-surface-offset); border-top-color: var(--ds-marine); animation: sb-ill-rot 0.8s linear infinite; }
          @keyframes sb-ill-rot { to { transform: rotate(360deg); } }
          .sb-ill-pulse { animation: sb-ill-p 1.2s ease-in-out infinite; }
          @keyframes sb-ill-p { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
          .sb-ill-bar { height: 100%; width: 55%; background: var(--ds-marine); animation: sb-ill-prog 1.5s ease-in-out infinite; }
          @keyframes sb-ill-prog { 0% { transform: translateX(-100%); } 100% { transform: translateX(120%); } }
        </style>
      </div>
    `,
  }),
};

export const Onboarding: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Onboarding</h2>
        <div style="display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          <div style="background: linear-gradient(145deg, var(--ds-marine-hl), var(--ds-surface-2)); padding: 36px 22px; border-radius: var(--ds-radius-xl); text-align: center; border: 1px solid var(--ds-divider);">
            <div style="width: 88px; height: 88px; margin: 0 auto 16px; background: var(--ds-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--ds-shadow-sm);">
              <ds-icon name="user" [size]="24" style="color:var(--ds-marine)"></ds-icon>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 17px;">Créer un compte</h3>
            <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.5;">Inscription rapide</p>
          </div>
          <div style="background: linear-gradient(145deg, var(--ds-primary-subtle), var(--ds-surface-2)); padding: 36px 22px; border-radius: var(--ds-radius-xl); text-align: center; border: 1px solid var(--ds-divider);">
            <div style="width: 88px; height: 88px; margin: 0 auto 16px; background: var(--ds-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--ds-shadow-sm);">
              <ds-icon name="building" [size]="24" style="color:var(--ds-primary)"></ds-icon>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 17px;">Publier des biens</h3>
            <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.5;">Ajoutez vos annonces</p>
          </div>
          <div style="background: linear-gradient(145deg, var(--ds-success-hl), var(--ds-surface-2)); padding: 36px 22px; border-radius: var(--ds-radius-xl); text-align: center; border: 1px solid var(--ds-divider);">
            <div style="width: 88px; height: 88px; margin: 0 auto 16px; background: var(--ds-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--ds-shadow-sm);">
              <ds-icon name="star" [size]="24" style="color:var(--ds-success)"></ds-icon>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 17px;">Conclure des ventes</h3>
            <p style="margin: 0; color: var(--ds-text-muted); font-size: 14px; line-height: 1.5;">Suivez vos dossiers</p>
          </div>
        </div>
      </div>
    `,
  }),
};
