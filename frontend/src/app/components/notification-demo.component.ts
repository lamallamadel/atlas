import { Component } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-demo',
  template: `
    <div class="notification-demo">
      <h2>NotificationService Demo</h2>
      
      <div class="demo-section">
        <h3>Types de base</h3>
        <div class="demo-buttons">
          <button mat-raised-button color="primary" (click)="showSuccess()">
            <mat-icon>check_circle</mat-icon> Success
          </button>
          <button mat-raised-button color="warn" (click)="showError()">
            <mat-icon>error</mat-icon> Error
          </button>
          <button mat-raised-button color="accent" (click)="showWarning()">
            <mat-icon>warning</mat-icon> Warning
          </button>
          <button mat-raised-button (click)="showInfo()">
            <mat-icon>info</mat-icon> Info
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Avec actions contextuelles</h3>
        <div class="demo-buttons">
          <button mat-raised-button color="primary" (click)="showSuccessWithUndo()">
            Success avec Annuler
          </button>
          <button mat-raised-button color="warn" (click)="showErrorWithRetry()">
            Error avec Réessayer
          </button>
          <button mat-raised-button (click)="showErrorWithDetails()">
            Error avec Détails
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Priorités</h3>
        <div class="demo-buttons">
          <button mat-raised-button (click)="showLowPriority()">
            Priorité basse
          </button>
          <button mat-raised-button color="primary" (click)="showNormalPriority()">
            Priorité normale
          </button>
          <button mat-raised-button color="accent" (click)="showHighPriority()">
            Priorité haute
          </button>
          <button mat-raised-button color="warn" (click)="showCritical()">
            <mat-icon>priority_high</mat-icon> Critique
          </button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Positions</h3>
        <div class="demo-buttons">
          <button mat-raised-button (click)="showTopLeft()">Top Left</button>
          <button mat-raised-button (click)="showTopCenter()">Top Center</button>
          <button mat-raised-button (click)="showTopRight()">Top Right</button>
          <button mat-raised-button (click)="showBottomLeft()">Bottom Left</button>
          <button mat-raised-button (click)="showBottomCenter()">Bottom Center</button>
          <button mat-raised-button (click)="showBottomRight()">Bottom Right</button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Gestion de la queue</h3>
        <div class="demo-buttons">
          <button mat-raised-button (click)="addMultipleNotifications()">
            Ajouter 5 notifications
          </button>
          <button mat-raised-button (click)="dismissCurrent()">
            Fermer la notification actuelle
          </button>
          <button mat-raised-button color="warn" (click)="clearQueue()">
            Vider la queue
          </button>
        </div>
        <p class="queue-info">Notifications en attente : {{ queueLength }}</p>
      </div>

      <div class="demo-section">
        <h3>Durées personnalisées</h3>
        <div class="demo-buttons">
          <button mat-raised-button (click)="showShort()">Courte (2s)</button>
          <button mat-raised-button (click)="showMedium()">Moyenne (5s)</button>
          <button mat-raised-button (click)="showLong()">Longue (10s)</button>
          <button mat-raised-button (click)="showIndefinite()">Indéfinie</button>
        </div>
      </div>

      <div class="demo-section">
        <h3>Cas d'usage réels</h3>
        <div class="demo-buttons">
          <button mat-raised-button color="primary" (click)="simulateSaveSuccess()">
            Sauvegarder (succès)
          </button>
          <button mat-raised-button color="warn" (click)="simulateSaveError()">
            Sauvegarder (erreur)
          </button>
          <button mat-raised-button (click)="simulateDelete()">
            Supprimer avec annulation
          </button>
          <button mat-raised-button (click)="simulateCriticalError()">
            Erreur critique
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-demo {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 32px;
      color: #333;
    }

    .demo-section {
      margin-bottom: 32px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .demo-section h3 {
      margin-bottom: 16px;
      color: #555;
      font-size: 18px;
    }

    .demo-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .demo-buttons button {
      min-width: 180px;
    }

    .demo-buttons button mat-icon {
      margin-right: 8px;
    }

    .queue-info {
      margin-top: 16px;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .demo-buttons button {
        min-width: 140px;
      }
    }
  `]
})
export class NotificationDemoComponent {
  queueLength = 0;

  constructor(private notificationService: NotificationService) {
    setInterval(() => {
      this.queueLength = this.notificationService.getQueueLength();
    }, 500);
  }

  showSuccess() {
    this.notificationService.success('Opération réussie avec succès');
  }

  showError() {
    this.notificationService.error('Une erreur est survenue');
  }

  showWarning() {
    this.notificationService.warning('Attention : quota presque atteint');
  }

  showInfo() {
    this.notificationService.info('Nouvelle mise à jour disponible');
  }

  showSuccessWithUndo() {
    this.notificationService.successWithUndo('Élément supprimé', () => {
      this.notificationService.info('Suppression annulée');
    });
  }

  showErrorWithRetry() {
    this.notificationService.errorWithRetry('Échec de la connexion', () => {
      this.notificationService.info('Reconnexion en cours...');
    });
  }

  showErrorWithDetails() {
    this.notificationService.errorWithDetails('Erreur lors du traitement', () => {
      alert('Détails de l\'erreur : Code 500 - Internal Server Error');
    });
  }

  showLowPriority() {
    this.notificationService.show({
      message: 'Message de priorité basse',
      type: 'info',
      priority: 'low'
    });
  }

  showNormalPriority() {
    this.notificationService.show({
      message: 'Message de priorité normale',
      type: 'success',
      priority: 'normal'
    });
  }

  showHighPriority() {
    this.notificationService.show({
      message: 'Message de priorité haute',
      type: 'warning',
      priority: 'high'
    });
  }

  showCritical() {
    this.notificationService.critical('Erreur critique détectée', 'Voir détails', () => {
      alert('Détails de l\'erreur critique');
    });
  }

  showTopLeft() {
    this.notificationService.show({
      message: 'Notification en haut à gauche',
      type: 'info',
      position: { horizontal: 'left', vertical: 'top' }
    });
  }

  showTopCenter() {
    this.notificationService.show({
      message: 'Notification en haut au centre',
      type: 'info',
      position: { horizontal: 'center', vertical: 'top' }
    });
  }

  showTopRight() {
    this.notificationService.show({
      message: 'Notification en haut à droite',
      type: 'info',
      position: { horizontal: 'right', vertical: 'top' }
    });
  }

  showBottomLeft() {
    this.notificationService.show({
      message: 'Notification en bas à gauche',
      type: 'info',
      position: { horizontal: 'left', vertical: 'bottom' }
    });
  }

  showBottomCenter() {
    this.notificationService.show({
      message: 'Notification en bas au centre',
      type: 'info',
      position: { horizontal: 'center', vertical: 'bottom' }
    });
  }

  showBottomRight() {
    this.notificationService.show({
      message: 'Notification en bas à droite',
      type: 'info',
      position: { horizontal: 'right', vertical: 'bottom' }
    });
  }

  addMultipleNotifications() {
    for (let i = 1; i <= 5; i++) {
      const types: ('success' | 'error' | 'warning' | 'info')[] = ['success', 'error', 'warning', 'info'];
      const type = types[i % 4];
      this.notificationService.show({
        message: `Notification ${i} de 5`,
        type
      });
    }
  }

  dismissCurrent() {
    this.notificationService.dismiss();
  }

  clearQueue() {
    this.notificationService.clearQueue();
    this.notificationService.info('Queue vidée');
  }

  showShort() {
    this.notificationService.show({
      message: 'Notification courte (2 secondes)',
      type: 'info',
      duration: 2000
    });
  }

  showMedium() {
    this.notificationService.show({
      message: 'Notification moyenne (5 secondes)',
      type: 'info',
      duration: 5000
    });
  }

  showLong() {
    this.notificationService.show({
      message: 'Notification longue (10 secondes)',
      type: 'warning',
      duration: 10000
    });
  }

  showIndefinite() {
    this.notificationService.show({
      message: 'Notification indéfinie (cliquez pour fermer)',
      type: 'info',
      duration: 0,
      dismissible: true
    });
  }

  simulateSaveSuccess() {
    this.notificationService.info('Sauvegarde en cours...');
    setTimeout(() => {
      this.notificationService.successWithUndo('Dossier enregistré', () => {
        this.notificationService.warning('Sauvegarde annulée');
      });
    }, 1500);
  }

  simulateSaveError() {
    this.notificationService.info('Sauvegarde en cours...');
    setTimeout(() => {
      this.notificationService.errorWithRetry('Échec de la sauvegarde', () => {
        this.simulateSaveSuccess();
      });
    }, 1500);
  }

  simulateDelete() {
    this.notificationService.successWithUndo('Élément supprimé', () => {
      this.notificationService.success('Suppression annulée - élément restauré');
    });
  }

  simulateCriticalError() {
    this.notificationService.critical(
      'Connexion au serveur perdue',
      'Reconnecter',
      () => {
        this.notificationService.info('Reconnexion en cours...');
        setTimeout(() => {
          this.notificationService.success('Connexion rétablie');
        }, 2000);
      }
    );
  }
}
