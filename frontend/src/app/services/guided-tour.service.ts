/**
 * GuidedTourService — 3 tours post-login Shepherd.js avec DS Atlasia tokens.
 *
 * Tour 1 : dashboard-welcome      → Vue d'ensemble du tableau de bord
 * Tour 2 : pipeline-dossiers      → Pipeline Kanban & gestion des dossiers
 * Tour 3 : messagerie-multicanal  → Messagerie WhatsApp / Email / SMS
 */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export type GuidedTourId = 'dashboard-welcome' | 'pipeline-dossiers' | 'messagerie-multicanal';

const STORAGE_KEY = 'atlas_guided_tours_v2';

interface TourState { completed: boolean; skipped?: boolean; completedAt?: string; }
type StateMap = Record<string, TourState>;

@Injectable({ providedIn: 'root' })
export class GuidedTourService {

  /* eslint-disable @typescript-eslint/no-explicit-any */
  shepherd: any = null;
  currentTour: any = null;

  constructor(private router: Router) {}

  /* ── Lazy-load Shepherd ── */
  async loadShepherd(): Promise<any> {
    if (this.shepherd) return this.shepherd;
    try {
      const mod = await import('shepherd.js');
      this.shepherd = mod.default ?? mod;
      return this.shepherd;
    } catch (e) {
      console.warn('[GuidedTour] Shepherd.js unavailable', e);
      return null;
    }
  }

  /* ── Public API ── */

  async autoStartIfNew(): Promise<void> {
    if (!this.isCompleted('dashboard-welcome')) {
      await this.start('dashboard-welcome');
    }
  }

  async start(id: GuidedTourId): Promise<void> {
    const S = await this.loadShepherd();
    if (!S) return;
    this.endCurrent();
    if (id === 'dashboard-welcome')     { await this.runDashboardWelcome(S); return; }
    if (id === 'pipeline-dossiers')     { await this.runPipelineDossiers(S); return; }
    if (id === 'messagerie-multicanal') { await this.runMessagingTour(S);    return; }
  }

  isCompleted(id: GuidedTourId): boolean {
    return this.readState()[id]?.completed ?? false;
  }

  reset(id?: GuidedTourId): void {
    if (id) {
      const all = this.readState();
      delete all[id];
      this.writeState(all);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  endCurrent(): void {
    try { this.currentTour?.cancel(); } catch { /* silent */ }
    this.currentTour = null;
  }

  /* ── Tour builder ── */
  buildTour(S: any, id: GuidedTourId): any {
    const tour = new S.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'atlas-tour-step',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: { enabled: true },
      },
    });
    tour.on('complete', () => this.markTour(id, false));
    tour.on('cancel',   () => this.markTour(id, true));
    return tour;
  }

  makeBtnNext(tour: any, label = 'Suivant') {
    return { text: label, action: () => tour.next(), classes: 'shepherd-btn-primary' };
  }
  makeBtnBack(tour: any) {
    return { text: '← Retour', action: () => tour.back(), classes: 'shepherd-btn-ghost', secondary: true };
  }
  makeBtnSkip(tour: any) {
    return { text: 'Passer', action: () => tour.cancel(), classes: 'shepherd-btn-ghost', secondary: true };
  }
  makeBtnFinish(tour: any) {
    return { text: '✓ Terminer', action: () => tour.complete(), classes: 'shepherd-btn-primary' };
  }

  /* ── Tour 1 : Dashboard Welcome ── */
  async runDashboardWelcome(S: any): Promise<void> {
    const id: GuidedTourId = 'dashboard-welcome';
    const t = this.buildTour(S, id);

    t.addStep({ id: 'welcome', title: '👋 Bienvenue sur Atlasia',
      text: `<p>Votre CRM immobilier est prêt. Ce guide rapide (<strong>3 min</strong>) vous présente les éléments clés.</p>`,
      buttons: [this.makeBtnSkip(t), this.makeBtnNext(t, 'Commencer')],
    });
    t.addStep({ id: 'kpis', title: '📊 Indicateurs clés',
      text: `<p>Ces cartes affichent vos <strong>KPIs en temps réel</strong> : dossiers actifs, relances, RDV et volume signé.</p>`,
      attachTo: { element: '[data-tour="kpis"], .kpi-row', on: 'bottom' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'kanban', title: '🏗️ Pipeline Kanban',
      text: `<p>Visualisez et faites glisser vos dossiers entre colonnes : <em>Nouveau → Qualification → Qualifié → RDV → Gagné</em>.</p>`,
      attachTo: { element: '[data-tour="kanban"], app-kanban-board', on: 'top' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'nav', title: '🧭 Navigation',
      text: `<p>Accédez aux <strong>Dossiers</strong>, <strong>Annonces</strong>, <strong>Tâches</strong> et aux outils d'analyse via le menu latéral.</p>`,
      attachTo: { element: '[data-tour="nav"], nav[role="navigation"]', on: 'right' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'shortcuts', title: '⌨️ Raccourcis clavier',
      text: `<p>Appuyez sur <kbd>?</kbd> pour tous les raccourcis. <kbd>G D</kbd> → Dashboard, <kbd>/</kbd> → Recherche rapide.</p>`,
      buttons: [this.makeBtnBack(t), this.makeBtnFinish(t)],
    });

    this.currentTour = t;
    t.start();
  }

  /* ── Tour 2 : Pipeline & Dossiers ── */
  async runPipelineDossiers(S: any): Promise<void> {
    const id: GuidedTourId = 'pipeline-dossiers';
    const t = this.buildTour(S, id);

    t.addStep({ id: 'intro', title: '📁 Gestion des dossiers',
      text: `<p>Un <strong>dossier</strong> représente un lead ou une transaction. Voici comment les créer et les piloter.</p>`,
      buttons: [this.makeBtnSkip(t), this.makeBtnNext(t, 'Démarrer')],
    });
    t.addStep({ id: 'new-dossier', title: '➕ Créer un dossier',
      text: `<p>Cliquez ici pour créer un nouveau dossier. Saisissez le prospect, son téléphone et l'annonce liée.</p>`,
      attachTo: { element: '[data-tour="new-dossier"], .btn-new-dossier', on: 'bottom' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'drag', title: '🖱️ Glisser-déposer',
      text: `<p>Faites glisser une carte pour <strong>changer le statut</strong>. La modification est enregistrée et l'audit mis à jour.</p>`,
      attachTo: { element: '[data-tour="kanban"], ds-kanban-column', on: 'top' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'stage', title: '🔄 Suivi de progression',
      text: `<p>La barre de progression indique l'étape courante dans le workflow commercial.</p>`,
      attachTo: { element: '[data-tour="stage"], ds-stage-stepper', on: 'bottom' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'parties', title: '👥 Parties prenantes',
      text: `<p>Ajoutez acheteurs, vendeurs et notaires via l'onglet <strong>Parties prenantes</strong>. Chacun reçoit les notifications adaptées.</p>`,
      buttons: [this.makeBtnBack(t), this.makeBtnFinish(t)],
    });

    this.currentTour = t;
    t.start();
  }

  /* ── Tour 3 : Messagerie multi-canal ── */
  async runMessagingTour(S: any): Promise<void> {
    const id: GuidedTourId = 'messagerie-multicanal';
    const t = this.buildTour(S, id);

    t.addStep({ id: 'intro', title: '💬 Messagerie multi-canal',
      text: `<p>Atlasia centralise vos échanges <strong>WhatsApp</strong>, <strong>Email</strong> et <strong>SMS</strong> dans une interface unifiée.</p>`,
      buttons: [this.makeBtnSkip(t), this.makeBtnNext(t, 'Découvrir')],
    });
    t.addStep({ id: 'thread', title: '📩 Fil de conversation',
      text: `<p>Le fil affiche tous les messages avec leur statut : <em>envoyé / délivré / lu / erreur</em>. Groupés par canal.</p>`,
      attachTo: { element: '[data-tour="thread"], ds-messaging-thread', on: 'top' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'whatsapp', title: '📱 WhatsApp Business',
      text: `<p>L'envoi WhatsApp utilise des <strong>modèles approuvés Meta</strong>. Sélectionnez un template, personnalisez et envoyez.</p>`,
      attachTo: { element: '[data-tour="whatsapp-tab"]', on: 'bottom' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'outbox', title: '📤 File d\'envoi',
      text: `<p>Les messages non distribués sont mis en <strong>file avec retry auto</strong>. L'onglet "Messages sortants" affiche l'état en temps réel.</p>`,
      attachTo: { element: '[data-tour="outbound"]', on: 'bottom' as const },
      buttons: [this.makeBtnBack(t), this.makeBtnNext(t)],
    });
    t.addStep({ id: 'consent', title: '🛡️ Consentements RGPD',
      text: `<p>Atlasia <strong>bloque automatiquement</strong> tout envoi marketing sans consentement actif du prospect.</p>`,
      buttons: [this.makeBtnBack(t), this.makeBtnFinish(t)],
    });

    this.currentTour = t;
    t.start();
  }

  /* ── Persistence ── */
  markTour(id: GuidedTourId, skipped: boolean): void {
    const all = this.readState();
    all[id] = { completed: !skipped, skipped, completedAt: new Date().toISOString() };
    this.writeState(all);
  }

  readState(): StateMap {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }

  writeState(s: StateMap): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}
