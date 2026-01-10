import { Injectable } from '@angular/core';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly STORAGE_KEY_PREFIX = 'filter_preset_';

  savePreset(context: string, name: string, filters: Record<string, unknown>): void {
    const preset: FilterPreset = {
      id: this.generateId(),
      name,
      filters,
      createdAt: new Date()
    };

    const presets = this.getPresets(context);
    presets.push(preset);
    
    localStorage.setItem(
      this.getStorageKey(context),
      JSON.stringify(presets)
    );
  }

  getPresets(context: string): FilterPreset[] {
    const data = localStorage.getItem(this.getStorageKey(context));
    if (!data) return [];

    try {
      const presets = JSON.parse(data);
      return presets.map((p: FilterPreset) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      }));
    } catch {
      return [];
    }
  }

  deletePreset(context: string, id: string): void {
    const presets = this.getPresets(context).filter(p => p.id !== id);
    localStorage.setItem(
      this.getStorageKey(context),
      JSON.stringify(presets)
    );
  }

  private getStorageKey(context: string): string {
    return `${this.STORAGE_KEY_PREFIX}${context}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
