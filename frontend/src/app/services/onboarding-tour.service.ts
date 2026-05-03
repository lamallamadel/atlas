import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TourDefinitionService } from './tour-definition.service';
import { AuthService } from './auth.service';

// Type definitions for Shepherd.js (lazy-loaded)
type ShepherdTour = any;

export interface TourProgress {
  [tourId: string]: {
    completed: boolean;
    completedAt?: string;
    currentStep?: number;
    skipped?: boolean;
    abandonedAt?: string;
    stepAbandonment?: { [stepIndex: number]: number };
  };
}

export interface TourAnalytics {
  tourId: string;
  action: 'started' | 'completed' | 'skipped' | 'abandoned' | 'step_completed' | 'step_abandoned';
  step?: number;
  stepName?: string;
  timestamp: string;
  duration?: number;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingTourService {
  private readonly STORAGE_KEY = 'onboarding_tour_progress';
  private readonly ANALYTICS_KEY = 'onboarding_tour_analytics';
  private readonly API_BASE = '/api/v1/user-preferences';
  
  private currentTour: ShepherdTour | null = null;
  private tourProgress: TourProgress = {};
  private tourStartTime: number | null = null;
  private syncInProgress = false;
  private shepherdLoaded = false;
  private shepherdModule: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private tourDefinitionService: TourDefinitionService,
    private authService: AuthService
  ) {
    this.loadProgress();
    this.setupRouteListener();
    this.syncWithBackend();
  }

  private loadProgress(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.tourProgress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tour progress:', error);
      this.tourProgress = {};
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tourProgress));
      this.syncWithBackend();
    } catch (error) {
      console.error('Failed to save tour progress:', error);
    }
  }

  private syncWithBackend(): void {
    if (this.syncInProgress) {
      return;
    }

    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    this.syncInProgress = true;
    this.http.put(`${this.API_BASE}/${userId}/tour-progress`, this.tourProgress)
      .pipe(
        catchError(error => {
          console.warn('Failed to sync tour progress with backend:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.syncInProgress = false;
      });
  }

  private loadProgressFromBackend(): void {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    this.http.get<TourProgress>(`${this.API_BASE}/${userId}/tour-progress`)
      .pipe(
        catchError(error => {
          console.warn('Failed to load tour progress from backend:', error);
          return of({});
        })
      )
      .subscribe(progress => {
        if (progress && Object.keys(progress).length > 0) {
          this.tourProgress = progress;
          this.saveProgressLocally();
        }
      });
  }

  private saveProgressLocally(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tourProgress));
    } catch (error) {
      console.error('Failed to save tour progress locally:', error);
    }
  }

  private getUserId(): string | null {
    // Get user ID from auth service or use a default for demo
    try {
      return (this.authService as { getCurrentUserId?: () => string }).getCurrentUserId?.() || 'demo-user';
    } catch {
      return 'demo-user';
    }
  }

  private trackAnalytics(analytics: TourAnalytics): void {
    try {
      // Add user ID to analytics
      analytics.userId = this.getUserId() || undefined;
      
      // Store locally
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      const events: TourAnalytics[] = stored ? JSON.parse(stored) : [];
      events.push(analytics);
      
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(events));
      
      // Log to console for debugging
      console.log('[Tour Analytics]', analytics);
      
      // Send to analytics endpoint (could integrate with GA4, Mixpanel, etc.)
      this.sendAnalyticsToBackend(analytics);
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  private sendAnalyticsToBackend(analytics: TourAnalytics): void {
    // Optional: Send analytics to backend for aggregation
    // This could be implemented as a separate endpoint
    // For now, we just log it
    if (window.gtag) {
      // Google Analytics 4 integration
      window.gtag('event', analytics.action, {
        event_category: 'Tour',
        event_label: analytics.tourId,
        tour_step: analytics.stepName || analytics.step,
        tour_duration: analytics.duration,
        user_id: analytics.userId
      });
    }
  }

  getAbandonmentRate(tourId: string): number {
    const progress = this.tourProgress[tourId];
    if (!progress || !progress.stepAbandonment) {
      return 0;
    }

    const tour = this.tourDefinitionService.getTour(tourId);
    if (!tour) {
      return 0;
    }

    const totalSteps = tour.steps.length;
    const abandonments = Object.values(progress.stepAbandonment).reduce((sum, count) => sum + count, 0);
    const starts = this.getAnalytics().filter(a => a.tourId === tourId && a.action === 'started').length;

    return starts > 0 ? (abandonments / (starts * totalSteps)) * 100 : 0;
  }

  getStepAbandonmentRates(tourId: string): { [stepIndex: number]: number } {
    const analytics = this.getAnalytics().filter(a => a.tourId === tourId);
    const starts = analytics.filter(a => a.action === 'started').length;
    
    if (starts === 0) {
      return {};
    }

    const abandonmentCounts: { [stepIndex: number]: number } = {};
    const tour = this.tourDefinitionService.getTour(tourId);
    
    if (!tour) {
      return {};
    }

    tour.steps.forEach((_, index) => {
      const stepAbandoned = analytics.filter(
        a => a.action === 'step_abandoned' && a.step === index
      ).length;
      abandonmentCounts[index] = (stepAbandoned / starts) * 100;
    });

    return abandonmentCounts;
  }

  private setupRouteListener(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.checkAutoStartTour(event.url);
      });
  }

  private checkAutoStartTour(url: string): void {
    if (url === '/dossiers/create' && !this.isTourCompleted('dossier-creation')) {
      setTimeout(() => this.startDossierCreationTour(), 500);
    } else if (url.match(/\/dossiers\/\d+/) && !this.isTourCompleted('dossier-detail')) {
      setTimeout(() => this.startDossierDetailTour(), 500);
    }
  }

  isTourCompleted(tourId: string): boolean {
    return this.tourProgress[tourId]?.completed || false;
  }

  resetTour(tourId: string): void {
    if (this.tourProgress[tourId]) {
      delete this.tourProgress[tourId];
      this.saveProgress();
    }
  }

  resetAllTours(): void {
    this.tourProgress = {};
    this.saveProgress();
    localStorage.removeItem(this.ANALYTICS_KEY);
  }

  getAnalytics(): TourAnalytics[] {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return [];
    }
  }

  private async loadShepherd(): Promise<any> {
    if (this.shepherdLoaded && this.shepherdModule) {
      return this.shepherdModule;
    }

    try {
      const { default: Shepherd } = await import('shepherd.js');
      this.shepherdModule = Shepherd;
      this.shepherdLoaded = true;
      return Shepherd;
    } catch (error) {
      console.error('Failed to load Shepherd.js:', error);
      throw error;
    }
  }

  private async createTour(tourId: string, options?: any): Promise<ShepherdTour> {
    if (this.currentTour) {
      this.currentTour.complete();
    }

    const Shepherd = await this.loadShepherd();

    const defaultOptions: any = {
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        }
      },
      ...options
    };

    this.currentTour = new Shepherd.Tour(defaultOptions);

    this.currentTour.on('complete', () => {
      const duration = this.tourStartTime ? Date.now() - this.tourStartTime : undefined;
      this.tourProgress[tourId] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      this.saveProgress();
      this.trackAnalytics({
        tourId,
        action: 'completed',
        timestamp: new Date().toISOString(),
        duration
      });
      this.tourStartTime = null;
    });

    this.currentTour.on('cancel', () => {
      const currentStep = this.currentTour?.getCurrentStep();
      const stepIndex = currentStep ? this.currentTour?.steps.indexOf(currentStep) : -1;
      
      if (!this.tourProgress[tourId]?.completed) {
        if (!this.tourProgress[tourId]) {
          this.tourProgress[tourId] = {
            completed: false,
            skipped: false
          };
        }
        
        // Track abandonment at specific step
        if (stepIndex !== undefined && stepIndex >= 0) {
          if (!this.tourProgress[tourId].stepAbandonment) {
            this.tourProgress[tourId].stepAbandonment = {};
          }
          const currentCount = this.tourProgress[tourId].stepAbandonment![stepIndex] || 0;
          this.tourProgress[tourId].stepAbandonment![stepIndex] = currentCount + 1;
          
          this.trackAnalytics({
            tourId,
            action: 'step_abandoned',
            step: stepIndex,
            stepName: currentStep?.id,
            timestamp: new Date().toISOString()
          });
        } else {
          this.tourProgress[tourId].skipped = true;
          this.trackAnalytics({
            tourId,
            action: 'skipped',
            timestamp: new Date().toISOString()
          });
        }
        
        this.tourProgress[tourId].abandonedAt = new Date().toISOString();
        this.saveProgress();
      }
      this.tourStartTime = null;
    });

    this.currentTour.on('start', () => {
      this.tourStartTime = Date.now();
      this.trackAnalytics({
        tourId,
        action: 'started',
        timestamp: new Date().toISOString()
      });
    });

    return this.currentTour;
  }

  async startDossierCreationTour(): Promise<void> {
    const tourId = 'dossier-creation';
    
    if (this.isTourCompleted(tourId)) {
      return;
    }

    const tour = await this.createTour(tourId);

    tour.addStep({
      id: 'welcome',
      title: '👋 Bienvenue dans la création de dossier',
      text: `
        <p>Ce guide vous accompagnera dans la création de votre premier dossier.</p>
        <p>Un dossier représente un lead ou prospect immobilier.</p>
      `,
      buttons: [
        {
          text: 'Passer',
          action: tour.cancel,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ]
    });

    tour.addStep({
      id: 'lead-name',
      title: '📝 Nom du prospect',
      text: `
        <p>Commencez par renseigner le nom du prospect.</p>
        <p>Ce champ est optionnel mais recommandé pour une meilleure organisation.</p>
      `,
      attachTo: {
        element: '[formControlName="leadName"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'lead-phone',
      title: '📱 Téléphone du prospect',
      text: `
        <p>Le numéro de téléphone permet de contacter le prospect.</p>
        <p><strong>Astuce :</strong> Le système détecte automatiquement les doublons pour éviter de créer plusieurs dossiers pour le même prospect.</p>
      `,
      attachTo: {
        element: '[formControlName="leadPhone"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 2,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'lead-source',
      title: '🎯 Source du lead',
      text: `
        <p>Indiquez d'où provient ce prospect (site web, téléphone, partenaire, etc.).</p>
        <p>Cette information aide à analyser l'efficacité de vos canaux d'acquisition.</p>
      `,
      attachTo: {
        element: '[formControlName="leadSource"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 3,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'annonce-link',
      title: '🏠 Lier à une annonce',
      text: `
        <p>Vous pouvez associer ce dossier à une annonce immobilière existante.</p>
        <p>Utilisez la recherche pour trouver l'annonce ou saisissez directement son ID.</p>
      `,
      attachTo: {
        element: '.annonce-autocomplete',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 4,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'submit',
      title: '✅ Créer le dossier',
      text: `
        <p>Une fois les informations saisies, cliquez sur "Créer" pour enregistrer le dossier.</p>
        <p>Vous serez redirigé vers la liste des dossiers où vous pourrez suivre son évolution.</p>
      `,
      attachTo: {
        element: 'button[type="submit"]',
        on: 'top'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Terminer',
          action: tour.complete
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 5,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.start();
  }

  async startDossierDetailTour(): Promise<void> {
    const tourId = 'dossier-detail';
    
    if (this.isTourCompleted(tourId)) {
      return;
    }

    const tour = await this.createTour(tourId);

    tour.addStep({
      id: 'overview',
      title: '🎉 Bienvenue dans le détail du dossier',
      text: `
        <p>Cette page regroupe toutes les informations et actions liées au dossier.</p>
        <p>Découvrons ensemble les fonctionnalités principales.</p>
      `,
      buttons: [
        {
          text: 'Passer',
          action: tour.cancel,
          secondary: true
        },
        {
          text: 'Commencer',
          action: tour.next
        }
      ]
    });

    tour.addStep({
      id: 'status-workflow',
      title: '🔄 Gestion du workflow',
      text: `
        <p>Le statut du dossier reflète sa progression dans votre pipeline de ventes.</p>
        <p>Cliquez sur le bouton pour changer le statut selon l'avancement du dossier.</p>
        <p><strong>Workflow :</strong> NOUVEAU → QUALIFICATION → QUALIFIÉ → RENDEZ-VOUS → GAGNÉ/PERDU</p>
      `,
      attachTo: {
        element: '.status-change-button',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'parties-prenantes',
      title: '👥 Parties prenantes',
      text: `
        <p>Ajoutez toutes les personnes impliquées dans le dossier : acheteurs, vendeurs, notaires, etc.</p>
        <p>Cliquez sur "Ajouter une partie prenante" pour commencer.</p>
      `,
      attachTo: {
        element: '.add-partie-button',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 2,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'messages',
      title: '💬 Messagerie',
      text: `
        <p>L'onglet Messages centralise tous les échanges avec le prospect.</p>
        <p>Vous pouvez envoyer des emails, SMS ou messages WhatsApp directement depuis cette interface.</p>
      `,
      attachTo: {
        element: '.messages-tab',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 3,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'appointments',
      title: '📅 Rendez-vous',
      text: `
        <p>Planifiez et suivez tous vos rendez-vous liés à ce dossier.</p>
        <p>Le système détecte les conflits d'horaires et envoie des rappels automatiques.</p>
      `,
      attachTo: {
        element: '.appointments-section',
        on: 'top'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 4,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'consentements',
      title: '✅ Gestion des consentements RGPD',
      text: `
        <p>Gérez les consentements de communication pour respecter le RGPD.</p>
        <p>Assurez-vous d'avoir le consentement avant d'envoyer des messages marketing.</p>
      `,
      attachTo: {
        element: '.consentements-section',
        on: 'top'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Terminer',
          action: tour.complete
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 5,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.start();
  }

  async startMessageCreationTour(): Promise<void> {
    const tourId = 'message-creation';
    
    if (this.isTourCompleted(tourId)) {
      return;
    }

    const tour = await this.createTour(tourId);

    tour.addStep({
      id: 'intro',
      title: '💬 Envoi de message',
      text: `
        <p>Vous pouvez envoyer des messages via différents canaux : Email, SMS, WhatsApp, etc.</p>
        <p>Voyons comment procéder.</p>
      `,
      buttons: [
        {
          text: 'Passer',
          action: tour.cancel,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ]
    });

    tour.addStep({
      id: 'channel',
      title: '📱 Choix du canal',
      text: `
        <p>Sélectionnez le canal de communication approprié.</p>
        <p><strong>Important :</strong> Vérifiez que vous avez le consentement du prospect pour le canal choisi.</p>
      `,
      attachTo: {
        element: '[formControlName="channel"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'content',
      title: '✍️ Contenu du message',
      text: `
        <p>Rédigez votre message ici.</p>
        <p><strong>Astuce :</strong> Personnalisez votre message avec le nom du prospect pour une meilleure relation client.</p>
      `,
      attachTo: {
        element: '[formControlName="content"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 2,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'send',
      title: '📤 Envoi',
      text: `
        <p>Cliquez sur "Envoyer" pour transmettre votre message.</p>
        <p>Vous pourrez suivre le statut de livraison dans l'historique des messages.</p>
      `,
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Terminer',
          action: tour.complete
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 3,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.start();
  }

  async startWorkflowStatusTour(): Promise<void> {
    const tourId = 'workflow-status';
    
    if (this.isTourCompleted(tourId)) {
      return;
    }

    const tour = await this.createTour(tourId);

    tour.addStep({
      id: 'intro',
      title: '🔄 Changement de statut',
      text: `
        <p>Le workflow de statut vous aide à suivre la progression de vos dossiers.</p>
        <p>Découvrons les différentes étapes.</p>
      `,
      buttons: [
        {
          text: 'Passer',
          action: tour.cancel,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ]
    });

    tour.addStep({
      id: 'status-select',
      title: '📊 Sélection du statut',
      text: `
        <p>Choisissez le nouveau statut selon la progression du dossier.</p>
        <p><strong>Workflow linéaire :</strong></p>
        <ul>
          <li><strong>NOUVEAU</strong> : Lead fraîchement créé</li>
          <li><strong>QUALIFICATION</strong> : Vérification des besoins et budget</li>
          <li><strong>QUALIFIÉ</strong> : Prospect validé et intéressé</li>
          <li><strong>RENDEZ-VOUS</strong> : Visite ou réunion planifiée</li>
          <li><strong>GAGNÉ</strong> : Transaction réussie ✅</li>
          <li><strong>PERDU</strong> : Opportunité abandonnée ❌</li>
        </ul>
      `,
      attachTo: {
        element: '[formControlName="status"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'terminal-states',
      title: '⚠️ États terminaux',
      text: `
        <p>Les statuts <strong>GAGNÉ</strong> et <strong>PERDU</strong> sont terminaux.</p>
        <p>Une fois un dossier marqué comme gagné ou perdu, vous ne pourrez plus changer son statut.</p>
        <p>Assurez-vous de bien valider avant de passer à ces statuts.</p>
      `,
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Suivant',
          action: tour.next
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 2,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.addStep({
      id: 'update-button',
      title: '💾 Enregistrement',
      text: `
        <p>Cliquez sur "Mettre à jour" pour enregistrer le changement de statut.</p>
        <p>Un historique de tous les changements est conservé dans l'audit trail.</p>
      `,
      attachTo: {
        element: '.update-status-button',
        on: 'top'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          secondary: true
        },
        {
          text: 'Terminer',
          action: tour.complete
        }
      ],
      when: {
        show: () => {
          this.trackAnalytics({
            tourId,
            action: 'step_completed',
            step: 3,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    tour.start();
  }

  startManualTour(tourId: 'dossier-creation' | 'dossier-detail' | 'message-creation' | 'workflow-status'): void {
    switch (tourId) {
      case 'dossier-creation':
        this.startDossierCreationTour();
        break;
      case 'dossier-detail':
        this.startDossierDetailTour();
        break;
      case 'message-creation':
        this.startMessageCreationTour();
        break;
      case 'workflow-status':
        this.startWorkflowStatusTour();
        break;
    }
  }

  cancelCurrentTour(): void {
    if (this.currentTour) {
      this.currentTour.cancel();
    }
  }
}
