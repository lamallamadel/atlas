import { Component, OnInit, OnDestroy, input, output } from '@angular/core';
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
    template: '',
    standalone: false
})
export abstract class CardWidgetBaseComponent implements OnInit, OnDestroy {
  readonly config = input.required<WidgetConfig>();
  readonly editMode = input(false);
  readonly remove = output<string>();
  readonly settingsChange = output<Record<string, unknown>>();
  readonly refresh = output<void>();

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
    this.remove.emit(this.config().id);
  }

  onRefresh(): void {
    this.loadData();
    // TODO: The 'emit' function requires a mandatory void argument
    this.refresh.emit();
  }

  updateSettings(settings: Record<string, unknown>): void {
    config.settings = { ...config.settings, ...settings };
    this.settingsChange.emit(config.settings);
    this.loadData();
  }

  protected setLoading(loading: boolean): void {
    this.loading = loading;
  }

  protected setError(error: string | null): void {
    this.error = error;
  }

  private setupAutoRefresh(): void {
    const config = this.config();
    if (config.refreshInterval && config.refreshInterval > 0) {
      setInterval(() => {
        if (!this.editMode()) {
          this.loadData();
        }
      }, config.refreshInterval * 1000);
    }
  }
}
