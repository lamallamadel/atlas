import type { Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { GlassTabbarComponent } from '../app/design-system/platform/ios/glass-tabbar.component';
import { M3AppBarComponent } from '../app/design-system/platform/android/m3-app-bar.component';
import { M3FabComponent } from '../app/design-system/platform/android/m3-fab.component';

const NAV_TABS = [
  { value: 'home',      label: 'Accueil',    icon: 'home' },
  { value: 'dossiers',  label: 'Dossiers',   icon: 'folder', badge: 4 },
  { value: 'annonces',  label: 'Annonces',   icon: 'building' },
  { value: 'calendar',  label: 'Agenda',     icon: 'calendar' },
  { value: 'settings',  label: 'Paramètres', icon: 'settings' },
];

/* ──────────────────────────────────────────────────────────
 * Story : 3 plateformes côte à côte (Web · iOS · Android)
 * ────────────────────────────────────────────────────────── */
const ThreePlatformsMeta: Meta = {
  title: 'Design System/Platform/3-Plateformes',
  tags: ['autodocs'],
};

export default ThreePlatformsMeta;

export const ThreePlatforms: StoryObj = {
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'wide' },
  },
  render: () => ({
    moduleMetadata: {
      imports: [CommonModule, DsIconComponent, DsBadgeComponent, GlassTabbarComponent, M3AppBarComponent, M3FabComponent],
    },
    template: `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;padding:32px;background:#f0ece4;min-height:100vh;align-items:start">

        <!-- ── WEB ── -->
        <div>
          <p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:12px">
            🖥  WEB — 1280px
          </p>
          <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
            <!-- Sidebar + content -->
            <div style="display:flex;height:520px">
              <!-- Sidebar -->
              <nav style="width:56px;background:var(--ds-marine);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px">
                <div style="width:32px;height:32px;background:var(--ds-primary);border-radius:8px;margin-bottom:12px"></div>
                @for (tab of navTabs; track tab.value) {
                  <button style="width:44px;height:44px;border-radius:10px;border:none;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s ease"
                    [style.background]="tab.value === 'dossiers' ? 'rgba(255,255,255,.15)' : ''"
                    [style.color]="tab.value === 'dossiers' ? '#fff' : ''">
                    <ds-icon [name]="tab.icon" [size]="20"></ds-icon>
                  </button>
                }
              </nav>
              <!-- Content -->
              <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
                <!-- Top bar -->
                <div style="height:52px;border-bottom:1px solid var(--ds-divider);display:flex;align-items:center;padding:0 20px;gap:12px">
                  <span style="font-size:15px;font-weight:600;color:var(--ds-text);flex:1">Dossiers</span>
                  <ds-badge status="new">12</ds-badge>
                  <button style="width:32px;height:32px;border-radius:8px;border:none;background:var(--ds-surface-offset);cursor:pointer;color:var(--ds-text-muted);display:flex;align-items:center;justify-content:center">
                    <ds-icon name="filter" [size]="16"></ds-icon>
                  </button>
                  <button style="height:32px;padding:0 14px;border-radius:8px;border:none;background:var(--ds-marine);color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
                    <ds-icon name="plus" [size]="16"></ds-icon>
                    Nouveau
                  </button>
                </div>
                <!-- Table preview -->
                <div style="flex:1;overflow:auto;padding:16px">
                  @for (row of tableRows; track row.id) {
                    <div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--ds-surface-offset)">
                      <div style="width:32px;height:32px;border-radius:50%;background:var(--ds-marine-hl);color:var(--ds-marine);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">{{row.initials}}</div>
                      <div>
                        <div style="font-size:13px;font-weight:500;color:var(--ds-text)">{{row.name}}</div>
                        <div style="font-size:11px;color:var(--ds-text-faint)">{{row.date}}</div>
                      </div>
                      <ds-badge [status]="row.badgeStatus">{{row.status}}</ds-badge>
                      <span style="font-size:12px;color:var(--ds-text-muted)">{{row.price}}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── iOS ── -->
        <div>
          <p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:12px">
            📱 iOS — 390×844
          </p>
          <div style="width:280px;margin:0 auto;background:var(--ds-surface);border-radius:44px;overflow:hidden;border:6px solid #1a1a1a;box-shadow:0 8px 40px rgba(0,0,0,.25);position:relative">
            <!-- Dynamic Island -->
            <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:100px;height:28px;background:#1a1a1a;border-radius:20px;z-index:10"></div>
            <!-- Status bar -->
            <div style="height:44px;background:var(--ds-surface);display:flex;align-items:flex-end;justify-content:space-between;padding:0 24px 6px;position:relative;z-index:9">
              <span style="font-size:12px;font-weight:600;color:var(--ds-text)">9:41</span>
              <div style="display:flex;gap:5px;align-items:center">
                <ds-icon name="chart" [size]="16" style="color:var(--ds-text)"></ds-icon>
                <ds-icon name="whatsapp" [size]="16" style="color:var(--ds-text)"></ds-icon>
              </div>
            </div>
            <!-- Large title -->
            <div style="padding:0 18px 12px">
              <h1 style="font-size:30px;font-weight:700;color:var(--ds-text);margin:0;letter-spacing:-0.5px">Dossiers</h1>
            </div>
            <!-- Search bar -->
            <div style="margin:0 18px 14px;background:var(--ds-surface-offset);border-radius:10px;height:36px;display:flex;align-items:center;gap:8px;padding:0 12px">
              <ds-icon name="search" [size]="16" style="color:var(--ds-text-faint)"></ds-icon>
              <span style="font-size:14px;color:var(--ds-text-faint)">Rechercher</span>
            </div>
            <!-- Cards -->
            <div style="padding:0 12px;display:flex;flex-direction:column;gap:8px;height:360px;overflow:hidden">
              @for (row of tableRows; track row.id) {
                <div style="background:var(--ds-surface);border-radius:12px;padding:12px;border:1px solid var(--ds-divider);display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--ds-marine-hl);color:var(--ds-marine);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">{{row.initials}}</div>
                  <div style="flex:1;overflow:hidden">
                    <div style="font-size:13px;font-weight:600;color:var(--ds-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{row.name}}</div>
                    <div style="font-size:11px;color:var(--ds-text-faint);margin-top:2px">{{row.date}} · {{row.price}}</div>
                  </div>
                  <ds-badge [status]="row.badgeStatus" size="sm">{{row.status}}</ds-badge>
                </div>
              }
            </div>
            <!-- Glass Tab bar -->
            <div style="position:relative;height:82px">
              <div style="position:absolute;inset:0;background:rgba(255,255,255,.75);backdrop-filter:blur(20px);border-top:0.5px solid var(--ds-divider)"></div>
              <div style="position:relative;display:flex;justify-content:space-around;padding:6px 0 0">
                @for (tab of navTabs; track tab.value) {
                  <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;cursor:pointer"
                    [style.color]="tab.value === 'dossiers' ? 'var(--ds-marine)' : 'var(--ds-text-faint)'">
                    <ds-icon [name]="tab.icon" [size]="22"></ds-icon>
                    <span style="font-size:9px;font-weight:500;letter-spacing:0.1px">{{tab.label}}</span>
                  </div>
                }
              </div>
              <div style="height:20px"></div>
            </div>
          </div>
        </div>

        <!-- ── Android ── -->
        <div>
          <p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:12px">
            🤖 Android — 360×800 (M3)
          </p>
          <div style="width:280px;margin:0 auto;background:var(--ds-surface);border-radius:28px;overflow:hidden;border:4px solid #2a2a2a;box-shadow:0 8px 40px rgba(0,0,0,.25)">
            <!-- Status bar -->
            <div style="height:28px;background:var(--ds-surface);padding:6px 16px;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11px;font-weight:700;color:var(--ds-text)">9:41</span>
              <div style="display:flex;gap:4px;align-items:center">
                <ds-icon name="chart" [size]="14" style="color:var(--ds-text)"></ds-icon>
                <ds-icon name="whatsapp" [size]="14" style="color:var(--ds-text)"></ds-icon>
              </div>
            </div>
            <!-- Top App Bar (M3) -->
            <div style="height:56px;display:flex;align-items:center;padding:0 8px;gap:4px">
              <button style="width:40px;height:40px;border:none;background:transparent;border-radius:50%;color:var(--ds-text);cursor:pointer;display:flex;align-items:center;justify-content:center">
                <ds-icon name="chevron-left" [size]="22"></ds-icon>
              </button>
              <h1 style="flex:1;font-size:18px;font-weight:400;color:var(--ds-text);margin:0;letter-spacing:0.1px">Dossiers</h1>
              <button style="width:40px;height:40px;border:none;background:transparent;border-radius:50%;color:var(--ds-text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center">
                <ds-icon name="search" [size]="22"></ds-icon>
              </button>
              <button style="width:40px;height:40px;border:none;background:transparent;border-radius:50%;color:var(--ds-text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center">
                <ds-icon name="filter" [size]="22"></ds-icon>
              </button>
            </div>
            <!-- Filter chips (M3 style) -->
            <div style="padding:0 12px 12px;display:flex;gap:6px;overflow:hidden">
              @for (chip of ['Tous', 'Nouveaux', 'En cours', 'Gagnés']; track chip) {
                <div style="padding:6px 14px;border-radius:8px;background:var(--chip-bg, var(--ds-surface-offset));border:1px solid var(--ds-divider);font-size:12px;font-weight:500;color:var(--ds-text-muted);white-space:nowrap;cursor:pointer"
                  [style.background]="chip === 'Tous' ? 'var(--ds-marine-hl)' : ''"
                  [style.color]="chip === 'Tous' ? 'var(--ds-marine)' : ''"
                  [style.border-color]="chip === 'Tous' ? 'var(--ds-marine)' : ''">
                  {{chip}}
                </div>
              }
            </div>
            <!-- List (M3 style) -->
            <div style="flex:1;overflow:hidden;height:340px">
              @for (row of tableRows; track row.id) {
                <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--ds-surface-offset)">
                  <div style="width:40px;height:40px;border-radius:50%;background:var(--ds-marine-hl);color:var(--ds-marine);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">{{row.initials}}</div>
                  <div style="flex:1;overflow:hidden">
                    <div style="font-size:13px;font-weight:500;color:var(--ds-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{row.name}}</div>
                    <div style="font-size:11px;color:var(--ds-text-faint);margin-top:2px">{{row.date}}</div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                    <ds-badge [status]="row.badgeStatus" size="sm">{{row.status}}</ds-badge>
                    <span style="font-size:11px;color:var(--ds-text-muted)">{{row.price}}</span>
                  </div>
                </div>
              }
            </div>
            <!-- Bottom nav (M3 Nav Bar) -->
            <div style="background:var(--ds-surface-2);border-top:1px solid var(--ds-divider);padding:4px 0 16px">
              <div style="display:flex;justify-content:space-around">
                @for (tab of navTabs; track tab.value) {
                  <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 12px;cursor:pointer;border-radius:16px;transition:background .15s ease"
                    [style.color]="tab.value === 'dossiers' ? 'var(--ds-marine)' : 'var(--ds-text-faint)'"
                    [style.background]="tab.value === 'dossiers' ? 'var(--ds-marine-hl)' : ''">
                    <ds-icon [name]="tab.icon" [size]="20"></ds-icon>
                    <span style="font-size:9.5px;font-weight:600">{{tab.label}}</span>
                  </div>
                }
              </div>
            </div>
          </div>
          <!-- FAB -->
          <div style="display:flex;justify-content:flex-end;padding-right:20px;margin-top:-56px;margin-bottom:8px;position:relative;z-index:10">
            <ds-m3-fab icon="plus" variant="primary" label="Nouveau dossier" size="regular"></ds-m3-fab>
          </div>
        </div>

      </div>
    `,
    props: {
      navTabs: NAV_TABS,
      tableRows: [
        { id: 1042, initials: 'MD', name: 'Marie Dupont',   date: '3 mai 2026',    status: 'Nouveau',       badgeStatus: 'new',           price: '450 000 €' },
        { id: 1041, initials: 'JM', name: 'Jean Martin',    date: '2 mai 2026',    status: 'Qualification', badgeStatus: 'qualification', price: '280 000 €' },
        { id: 1040, initials: 'SB', name: 'Sophie Bernard', date: '1 mai 2026',    status: 'RDV',           badgeStatus: 'rdv',           price: '395 000 €' },
        { id: 1039, initials: 'PL', name: 'Paul Leroy',     date: '28 avr. 2026',  status: 'Gagné',         badgeStatus: 'won',           price: '520 000 €' },
      ],
    },
  }),
};
