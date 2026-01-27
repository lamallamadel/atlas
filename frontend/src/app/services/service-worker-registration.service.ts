import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';

export interface ServiceWorkerState {
  registered: boolean;
  updateAvailable: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerRegistrationService {
  private stateSubject = new BehaviorSubject<ServiceWorkerState>({
    registered: false,
    updateAvailable: false,
    error: null
  });

  public state$: Observable<ServiceWorkerState> = this.stateSubject.asObservable();
  private registration: ServiceWorkerRegistration | null = null;

  constructor(private notificationService: NotificationService) {}

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      this.stateSubject.next({
        registered: false,
        updateAvailable: false,
        error: 'Service Worker not supported'
      });
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration);

      this.stateSubject.next({
        registered: true,
        updateAvailable: false,
        error: null
      });

      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event);
      });

      this.checkForUpdates();
    } catch (error: any) {
      console.error('Service Worker registration failed:', error);
      this.stateSubject.next({
        registered: false,
        updateAvailable: false,
        error: error.message
      });
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      this.stateSubject.next({
        registered: false,
        updateAvailable: false,
        error: null
      });
    }
  }

  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  async skipWaiting(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async clearCache(): Promise<void> {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  }

  isRegistered(): boolean {
    return this.stateSubject.value.registered;
  }

  isUpdateAvailable(): boolean {
    return this.stateSubject.value.updateAvailable;
  }

  private handleUpdateFound(): void {
    if (!this.registration) {
      return;
    }

    const newWorker = this.registration.installing;
    if (!newWorker) {
      return;
    }

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('New Service Worker available');
        
        this.stateSubject.next({
          ...this.stateSubject.value,
          updateAvailable: true
        });

        this.notificationService.info(
          'Une nouvelle version est disponible',
          'Actualiser',
          () => {
            this.skipWaiting();
            window.location.reload();
          }
        );
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    console.log('Message from Service Worker:', event.data);

    if (event.data && event.data.type === 'SYNC_QUEUE') {
      window.dispatchEvent(new CustomEvent('sw-sync-queue', {
        detail: { timestamp: event.data.timestamp }
      }));
    }
  }
}
