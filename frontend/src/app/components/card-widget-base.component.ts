import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  x?: number;
  y?: number;
  cols?: number;
  rows?: number;
  refreshInterval?: number;
  settings?: Record<string, unknown>;
}

@Component({
  template: ''
})
export abstract class CardWidgetBaseComponent implements OnInit, OnDestroy {
  @Input() config!: WidgetConfig;
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
    this.config.settings = { ...this.config.settings, ...settings };
    this.settingsChange.emit(this.config.settings);
    this.loadData();
  }

  protected setLoading(loading: boolean): void {
    this.loading = loading;
  }

  protected setError(error: string | null): void {
    this.error = error;
  }

  private setupAutoRefresh(): void {
    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      setInterval(() => {
        if (!this.editMode) {
          this.loadData();
        }
      }, this.config.refreshInterval * 1000);
    }
  }
}
