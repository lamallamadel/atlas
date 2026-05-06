import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

import type { DashboardWidgetConfig } from '../models/dashboard-layout.model';

/**
 * Logique partagée des widgets du tableau de bord personnalisable.
 * La surface visuelle est `ds-card` dans le template de chaque widget ; ce fichier ne fournit pas de carte Material/HTML maison.
 */
@Directive()
export abstract class DashboardWidgetBase implements OnInit, OnDestroy {
  @Input({ required: true }) config!: DashboardWidgetConfig;
  @Input() editMode = false;
  @Output() remove = new EventEmitter<string>();
  @Output() settingsChange = new EventEmitter<Record<string, unknown>>();
  @Output() refresh = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  protected destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  abstract loadData(): void;

  onRemove(): void {
    this.remove.emit(this.config.id);
  }

  onRefresh(): void {
    this.loadData();
    this.refresh.emit();
  }

  updateSettings(settings: Record<string, unknown>): void {
    const updatedSettings = { ...this.config.settings, ...settings };
    this.settingsChange.emit(updatedSettings);
    this.loadData();
  }

  protected setLoading(loading: boolean): void {
    this.loading = loading;
  }

  protected setError(error: string | null): void {
    this.error = error;
  }

  private setupAutoRefresh(): void {
    const interval = this.config.refreshInterval;
    if (interval != null && interval > 0) {
      setInterval(() => {
        if (!this.editMode) {
          this.loadData();
        }
      }, interval * 1000);
    }
  }
}
