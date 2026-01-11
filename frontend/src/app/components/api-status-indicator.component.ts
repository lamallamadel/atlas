import { Component, OnInit, OnDestroy } from '@angular/core';
import { PingService } from '../services/ping.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-api-status-indicator',
  templateUrl: './api-status-indicator.component.html',
  styleUrls: ['./api-status-indicator.component.css']
})
export class ApiStatusIndicatorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
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

  checkApiConnection(): void {
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
}
