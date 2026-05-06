import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DsTabsComponent, DsTab } from '../app/design-system/index';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsAvatarComponent } from '../app/design-system/primitives/ds-avatar/ds-avatar.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';

interface MockParty {
  id: number;
  name: string;
  role: string;
  phone: string;
  email?: string;
  initials: string;
}

interface MockAppointment {
  id: number;
  date: string;
  time: string;
  location: string;
  status: 'active' | 'won' | 'neutral' | 'warning';
  statusLabel: string;
  notes?: string;
}

const PARTIES: MockParty[] = [
  { id: 1, name: 'Aminata Diallo',  role: 'Acheteur',   phone: '+221 77 123 45 67', email: 'aminata@example.com', initials: 'AD' },
  { id: 2, name: 'Moussa Konaté',  role: 'Vendeur',    phone: '+221 78 987 65 43', initials: 'MK' },
  { id: 3, name: 'Cabinet Ndiaye',  role: 'Notaire',    phone: '+221 33 456 78 90', email: 'contact@ndiaye.sn', initials: 'CN' },
];

const APPOINTMENTS: MockAppointment[] = [
  { id: 1, date: '5 mai 2026', time: '10:00', location: 'Villa Almadies, Dakar',  status: 'active', statusLabel: 'Programmé', notes: 'Visite avec architecte' },
  { id: 2, date: '8 mai 2026', time: '14:30', location: 'Agence Pro Space',        status: 'warning', statusLabel: 'À confirmer' },
  { id: 3, date: '28 avr. 2026', time: '11:00', location: 'Bureau client',         status: 'won', statusLabel: 'Terminé' },
];

const TABS: DsTab[] = [
  { value: 'informations',  label: 'Informations' },
  { value: 'parties',       label: 'Parties prenantes' },
  { value: 'messages',      label: 'Messages' },
  { value: 'rendezvous',    label: 'Rendez-vous' },
  { value: 'consentements', label: 'Consentements' },
  { value: 'documents',     label: 'Documents' },
  { value: 'chronologie',   label: 'Chronologie' },
  { value: 'historique',    label: 'Historique' },
];

@Component({
  selector: 'sb-dossier-detail-mock',
  standalone: true,
  imports: [
    CommonModule,
    DsTabsComponent, DsBadgeComponent, DsButtonComponent, DsAvatarComponent,
    DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div class="page-container" style="padding:32px;max-width:1280px;margin:0 auto;background:var(--ds-bg);min-height:100vh;">
      @if (loading) {
        <div style="display:flex;flex-direction:column;gap:16px;">
          <ds-skeleton variant="text" width="200px" height="14px"></ds-skeleton>
          <ds-skeleton variant="rect" height="120px"></ds-skeleton>
          <ds-skeleton variant="rect" height="60px"></ds-skeleton>
          <ds-skeleton variant="rect" height="400px"></ds-skeleton>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:20px;">

          <!-- Lien retour -->
          <a class="link-back" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ds-marine);font-weight:600;cursor:pointer;text-decoration:none;">
            <span aria-hidden="true">←</span> Retour aux dossiers
          </a>

          <!-- En-tête dossier -->
          <div class="dossier-header" style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <h1 style="font-size:20px;font-weight:700;margin:0;color:var(--ds-text);">
                  Dossier #142 — Aminata Diallo / +221 77 123 45 67
                </h1>
                <ds-badge status="rdv">RDV</ds-badge>
              </div>
              <ds-button variant="ghost" size="sm">Changer statut</ds-button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Téléphone</span>
                <span style="font-size:13.5px;color:var(--ds-text);">+221 77 123 45 67</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Source</span>
                <span style="font-size:13.5px;color:var(--ds-text);">Site web</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Annonce liée</span>
                <span style="font-size:13.5px;color:var(--ds-marine);font-weight:600;">#12</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Créé le</span>
                <span style="font-size:13.5px;color:var(--ds-text);">2 mai 2026</span>
              </div>
            </div>
          </div>

          <!-- Coach Virtuel -->
          @if (showCoach) {
            <div style="display:flex;gap:12px;padding:14px 16px;background:linear-gradient(135deg,rgba(13,44,74,.04) 0%,rgba(175,97,30,.04) 100%);border:1px solid var(--ds-divider);border-left:3px solid var(--ds-primary);border-radius:8px;">
              <div style="width:36px;height:36px;border-radius:8px;background:var(--ds-primary-hl);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:18px;">💡</span>
              </div>
              <div style="flex:1;">
                <h4 style="margin:0;font-size:13px;font-weight:700;">Coach Virtuel Atlas</h4>
                <p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--ds-text-muted);">
                  Le client a consulté l'annonce 4 fois cette semaine. C'est le bon moment pour proposer une visite.
                </p>
              </div>
            </div>
          }

          <!-- Tabs DS -->
          <ds-tabs [tabs]="tabs" [activeTab]="activeTab" variant="underline"
            (tabChange)="activeTab = $event"></ds-tabs>

          <!-- Tab content -->
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:16px;">
            @if (activeTab === 'informations') {
              <!-- Section Essentiel -->
              <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;">
                <header style="padding:14px 18px;border-bottom:1px solid var(--ds-divider);">
                  <h3 style="margin:0;font-size:13px;font-weight:700;letter-spacing:.2px;text-transform:uppercase;">Essentiel</h3>
                </header>
                <div style="padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Statut</div>
                    <ds-badge status="rdv">RDV</ds-badge>
                  </div>
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Score</div>
                    <div style="font-size:13.5px;font-weight:600;color:var(--ds-success);">85 / 100</div>
                  </div>
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;letter-spacing:.6px;">Source</div>
                    <div style="font-size:13.5px;color:var(--ds-text);">Site web · #12</div>
                  </div>
                </div>
              </section>

              <!-- Grid Prospect / Annonce -->
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">
                <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;">
                  <header style="padding:14px 18px;border-bottom:1px solid var(--ds-divider);">
                    <h3 style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.2px;">Prospect</h3>
                  </header>
                  <div style="padding:18px;font-size:13.5px;line-height:1.6;color:var(--ds-text);">
                    <strong>Aminata Diallo</strong><br>
                    Téléphone : +221 77 123 45 67<br>
                    Email : aminata@example.com<br>
                    Localisation : Dakar, Sénégal
                  </div>
                </section>
                <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;">
                  <header style="padding:14px 18px;border-bottom:1px solid var(--ds-divider);">
                    <h3 style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.2px;">Annonce liée</h3>
                  </header>
                  <div style="padding:18px;font-size:13.5px;line-height:1.6;color:var(--ds-text);">
                    <strong>Villa 4 pièces Almadies</strong><br>
                    Prix : 120 000 000 €<br>
                    Surface : 280 m²<br>
                    Statut : <ds-badge status="active" size="sm">ACTIVE</ds-badge>
                  </div>
                </section>
              </div>
            }

            @if (activeTab === 'parties') {
              <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
                <ds-button variant="marine" size="md">+ Ajouter une partie</ds-button>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                @for (p of parties; track p.id) {
                  <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:8px;padding:12px 16px;display:flex;gap:12px;align-items:center;">
                    <ds-avatar [name]="p.name" size="md"></ds-avatar>
                    <div style="flex:1;">
                      <div style="font-size:13.5px;font-weight:600;">{{ p.name }}</div>
                      <div style="font-size:12px;color:var(--ds-text-muted);">{{ p.role }} · {{ p.phone }} @if (p.email) { · {{ p.email }} }</div>
                    </div>
                    <button style="width:32px;height:32px;border-radius:6px;border:1px solid var(--ds-divider);background:transparent;cursor:pointer;color:var(--ds-text-muted);">✏️</button>
                    <button style="width:32px;height:32px;border-radius:6px;border:1px solid var(--ds-error);background:transparent;cursor:pointer;color:var(--ds-error);">🗑️</button>
                  </div>
                }
              </div>
            }

            @if (activeTab === 'rendezvous') {
              <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
                <ds-button variant="marine" size="md">+ Nouveau RDV</ds-button>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                @for (a of appointments; track a.id) {
                  <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:8px;padding:14px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:60px;flex-shrink:0;">
                      <div style="font-size:11px;font-weight:700;color:var(--ds-text-faint);text-transform:uppercase;">{{ a.date.split(' ')[1] }}</div>
                      <div style="font-size:22px;font-weight:700;color:var(--ds-marine);">{{ a.date.split(' ')[0] }}</div>
                    </div>
                    <div style="flex:1;min-width:200px;">
                      <div style="font-size:13.5px;font-weight:600;color:var(--ds-text);">{{ a.time }} · {{ a.location }}</div>
                      @if (a.notes) {
                        <div style="font-size:12px;color:var(--ds-text-muted);margin-top:2px;">{{ a.notes }}</div>
                      }
                    </div>
                    <ds-badge [status]="a.status" size="sm">{{ a.statusLabel }}</ds-badge>
                  </div>
                }
              </div>
            }

            @if (activeTab === 'messages') {
              <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;display:flex;flex-direction:column;height:520px;">
                <div style="display:flex;flex-direction:column;gap:8px;padding:14px;flex:1;overflow:auto;">
                  <div style="align-self:flex-start;max-width:75%;">
                    <div style="padding:8px 12px;border-radius:12px;background:var(--ds-surface-offset);font-size:13px;">Bonjour, je suis intéressée par la villa des Almadies.</div>
                    <div style="font-size:11px;color:var(--ds-text-faint);margin-top:4px;">10:23 · WhatsApp</div>
                  </div>
                  <div style="align-self:flex-end;max-width:75%;">
                    <div style="padding:8px 12px;border-radius:12px;background:var(--ds-marine);color:var(--ds-text-inverse);font-size:13px;">Bonjour Aminata, je vous propose une visite jeudi à 10h. Cela vous convient-il ?</div>
                    <div style="font-size:11px;color:var(--ds-text-faint);margin-top:4px;text-align:right;">10:35 · ✓✓ Lu</div>
                  </div>
                  <div style="align-self:flex-start;max-width:75%;">
                    <div style="padding:8px 12px;border-radius:12px;background:var(--ds-surface-offset);font-size:13px;">Parfait, je serai présente. Merci !</div>
                    <div style="font-size:11px;color:var(--ds-text-faint);margin-top:4px;">10:38 · WhatsApp</div>
                  </div>
                </div>
                <div style="display:flex;gap:8px;padding:8px 12px;border-top:1px solid var(--ds-divider);align-items:center;">
                  <input type="text" placeholder="Tapez votre message..." style="flex:1;height:36px;padding:0 12px;border:1px solid var(--ds-divider);border-radius:8px;font-size:13px;" />
                  <ds-button variant="marine" size="md">Envoyer</ds-button>
                </div>
              </div>
            }

            @if (activeTab === 'documents' || activeTab === 'consentements' || activeTab === 'chronologie' || activeTab === 'historique') {
              <ds-empty-state
                title="Aucun élément"
                description="Cette section est vide pour le moment."
                ctaLabel="Ajouter">
              </ds-empty-state>
            }
          </div>
        </div>
      }
    </div>
  `,
})
class DossierDetailMockComponent {
  @Input() loading = false;
  @Input() showCoach = true;
  @Input() activeTab = 'informations';
  tabs = TABS;
  parties = PARTIES;
  appointments = APPOINTMENTS;
}

const meta: Meta<DossierDetailMockComponent> = {
  title: 'Pages/Dossier — Détail',
  component: DossierDetailMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({ imports: [DossierDetailMockComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    activeTab: {
      control: 'select',
      options: TABS.map(t => t.value),
    },
    loading: { control: 'boolean' },
    showCoach: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DossierDetailMockComponent>;

export const OngletInformations: Story = { args: { activeTab: 'informations' } };
export const OngletPartiesPrenantes: Story = { args: { activeTab: 'parties' } };
export const OngletRendezVous: Story = { args: { activeTab: 'rendezvous' } };
export const OngletMessages: Story = { args: { activeTab: 'messages' } };
export const OngletVide: Story = { args: { activeTab: 'documents' } };
export const EnChargement: Story = { args: { loading: true } };
