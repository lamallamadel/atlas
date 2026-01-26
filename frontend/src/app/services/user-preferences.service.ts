import { Injectable } from '@angular/core';

export interface UserPreferences {
  dossierViewMode?: 'list' | 'kanban';
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly STORAGE_KEY = 'user_preferences';

  getPreferences(): UserPreferences {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return {};
    }
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    const prefs = this.getPreferences();
    prefs[key] = value;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }

  getPreference<K extends keyof UserPreferences>(key: K, defaultValue?: UserPreferences[K]): UserPreferences[K] {
    const prefs = this.getPreferences();
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  }

  clearPreferences(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
