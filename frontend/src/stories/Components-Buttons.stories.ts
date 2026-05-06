import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';
import { M3FabComponent } from '../app/design-system/platform/android/m3-fab.component';

const ICON_PLUS =
  '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
const meta: Meta = {
  title: 'Design System/Recipes/Buttons',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, DsButtonComponent, DsIconComponent, M3FabComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Boutons Atlasia via ds-button (marine, copper, ghost, danger, icon). Voir aussi Design System / Primitives / DsButton pour les contrôles Storybook.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Variantes</h2>
        <div style="display:grid;gap:28px;">
          <section>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Primaire / accent (marine & copper)</h3>
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
              <ds-button variant="marine" size="md">Enregistrer</ds-button>
              <ds-button variant="marine" size="md" [disabled]="true">Désactivé</ds-button>
              <ds-button variant="marine" size="md" [prefixIcon]="iconPlus">Avec icône</ds-button>
              <ds-button variant="copper" size="md">Publier</ds-button>
            </div>
          </section>
          <section>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Ghost & danger</h3>
            <div style="display:flex;flex-wrap:wrap;gap:12px;">
              <ds-button variant="ghost" size="md">Annuler</ds-button>
              <ds-button variant="danger" size="md">Supprimer</ds-button>
            </div>
          </section>
          <section>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">Icône seule (aria-label obligatoire)</h3>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
              <ds-button variant="icon" size="md" ariaLabel="Ajouter"><ds-icon name="plus" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md" ariaLabel="Modifier"><ds-icon name="edit" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md" ariaLabel="Corbeille"><ds-icon name="trash" [size]="20"></ds-icon></ds-button>
              <ds-button variant="icon" size="md" [disabled]="true" ariaLabel="Inactif"><ds-icon name="close" [size]="20"></ds-icon></ds-button>
            </div>
          </section>
          <section>
            <h3 style="margin-bottom: 12px; color: var(--ds-text-muted); font-size: 15px;">FAB (plateforme M3)</h3>
            <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
              <ds-m3-fab icon="plus" variant="primary" size="regular" label="Créer"></ds-m3-fab>
              <ds-m3-fab icon="edit" variant="secondary" size="small" label="Éditer"></ds-m3-fab>
            </div>
          </section>
        </div>
      </div>
    `,
    props: { iconPlus: ICON_PLUS },
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Tailles</h2>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
          <ds-button variant="marine" size="sm">SM</ds-button>
          <ds-button variant="marine" size="md">MD</ds-button>
          <ds-button variant="marine" size="lg">LG</ds-button>
        </div>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">États</h2>
        <div style="display:flex;flex-direction:column;gap:20px;max-width:420px;">
          <div>
            <p style="margin:0 0 8px;font-size:13px;color:var(--ds-text-muted);">Normal</p>
            <ds-button variant="marine" size="md">Valider</ds-button>
          </div>
          <div>
            <p style="margin:0 0 8px;font-size:13px;color:var(--ds-text-muted);">Désactivé</p>
            <ds-button variant="marine" size="md" [disabled]="true">Indisponible</ds-button>
          </div>
          <div>
            <p style="margin:0 0 8px;font-size:13px;color:var(--ds-text-muted);">Chargement</p>
            <ds-button variant="marine" size="md" [loading]="true">Envoi…</ds-button>
          </div>
          <div>
            <p style="margin:0 0 8px;font-size:13px;color:var(--ds-text-muted);">Focus clavier (tab jusqu’au bouton)</p>
            <ds-button variant="marine" size="md">Focus visible natif</ds-button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Groups: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Groupes d’actions</h2>
        <div style="display:flex;gap:12px;justify-content:flex-end;max-width:480px;padding:16px;border:1px solid var(--ds-divider);border-radius:var(--ds-radius-lg);background:var(--ds-surface);">
          <ds-button variant="ghost" size="md">Annuler</ds-button>
          <ds-button variant="marine" size="md">Enregistrer</ds-button>
        </div>
      </div>
    `,
  }),
};

export const UsageSnippet: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 16px;">Exemple</h2>
        <pre style="background:var(--ds-surface-2);padding:16px;border-radius:var(--ds-radius-md);overflow-x:auto;font-family:monospace;font-size:13px;border:1px solid var(--ds-divider);"><code>&lt;ds-button variant="marine" size="md" [loading]="isSaving"&gt;
  Enregistrer
&lt;/ds-button&gt;

&lt;ds-button variant="icon" size="md" ariaLabel="Fermer"&gt;
  &lt;ds-icon name="close" [size]="20" /&gt;
&lt;/ds-button&gt;</code></pre>
      </div>
    `,
  }),
};
