import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { PingService } from '../services/ping.service';
import { Subject, takeUntil } from 'rxjs';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { DsIconComponent } from '../design-system/icons/ds-icon.component';

@Component({
    selector: 'app-api-status-indicator',
    templateUrl: './api-status-indicator.component.html',
    styleUrls: ['./api-status-indicator.component.css'],
    imports: [MatButton, CdkConnectedOverlay, CdkOverlayOrigin, DsIconComponent, DatePipe]
})
export class ApiStatusIndicatorComponent implements OnInit, OnDestroy {
  private readonly overlay = inject(Overlay);

  private destroy$ = new Subject<void>();

  statusMenuOpen = false;
  readonly statusMenuScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly statusMenuPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];
  
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  lastChecked: Date | null = null;

  constructor(private pingService: PingService) { }

  ngOnInit(): void {
    this.checkApiConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleStatusMenu(): void {
    this.statusMenuOpen = !this.statusMenuOpen;
  }

  closeStatusMenu(): void {
    this.statusMenuOpen = false;
  }

  checkApiConnection(): void {
    this.closeStatusMenu();
    this.apiStatus = 'checking';

    this.pingService.ping()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.apiStatus = 'connected';
          this.lastChecked = new Date();
        },
        error: () => {
          this.apiStatus = 'disconnected';
          this.lastChecked = new Date();
        }
      });
  }

  getStatusText(): string {
    switch (this.apiStatus) {
      case 'connected':
        return 'API connectée';
      case 'disconnected':
        return 'API déconnectée';
      case 'checking':
        return 'Vérification...';
      default:
        return '';
    }
  }

  getTooltipText(): string {
    if (this.lastChecked) {
      return `Dernière vérification: ${this.lastChecked.toLocaleString('fr-FR')}`;
    }
    return 'Vérification de la connexion API';
  }

  getStatusClass(): string {
    return `status-${this.apiStatus}`;
  }

  statusMenuIcon(): 'check' | 'alert-circle' | 'refresh' {
    switch (this.apiStatus) {
      case 'connected':
        return 'check';
      case 'disconnected':
        return 'alert-circle';
      default:
        return 'refresh';
    }
  }
}
