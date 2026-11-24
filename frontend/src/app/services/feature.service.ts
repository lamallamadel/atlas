import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Un module du catalogue et son état pour l'agence (GET /api/v1/features). */
export interface FeatureStatus {
  key: string;
  label: string;
  enabled: boolean;
  core: boolean;
  /** Bloqué côté API quand désactivé. */
  enforced: boolean;
}

/**
 * Modules de l'agence (spec 05_feature_flags_plans). Sert à masquer ce qui n'est pas inclus ; le
 * serveur reste seul juge et répond 403 FEATURE_DISABLED. Tant que la liste n'est pas chargée, ou
 * si elle ne peut pas l'être, un module est considéré actif, comme côté serveur par défaut.
 */
@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpClient);
  private readonly flags = signal<Record<string, boolean>>({});
  private loaded = false;

  /** Charge la liste une fois par session. */
  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.http.get<FeatureStatus[]>('/api/v1/features').subscribe({
      next: list => this.flags.set(Object.fromEntries(list.map(f => [f.key, f.enabled]))),
      error: () => { this.loaded = false; },
    });
  }

  isEnabled(key: string): boolean {
    return this.flags()[key] ?? true;
  }
}
