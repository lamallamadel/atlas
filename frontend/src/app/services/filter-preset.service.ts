import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FilterPreset {
  id?: number;
  name: string;
  filterType: string;
  description?: string;
  filterConfig: Record<string, unknown>;
  isShared?: boolean;
  isPredefined?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FilterPresetRequest {
  name: string;
  filterType: string;
  description?: string;
  filterConfig: Record<string, unknown>;
  isShared?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly apiUrl = '/api/v1/filter-presets';
  private readonly STORAGE_KEY_PREFIX = 'filter_preset_';

  constructor(private http: HttpClient) {}

  create(request: FilterPresetRequest): Observable<FilterPreset> {
    return this.http.post<FilterPreset>(this.apiUrl, request).pipe(
      map(preset => this.mapDates(preset))
    );
  }

  getById(id: number): Observable<FilterPreset> {
    return this.http.get<FilterPreset>(`${this.apiUrl}/${id}`).pipe(
      map(preset => this.mapDates(preset))
    );
  }

  getAccessiblePresets(filterType: string): Observable<FilterPreset[]> {
    return this.http.get<FilterPreset[]>(this.apiUrl, {
      params: { filterType }
    }).pipe(
      map(presets => presets.map(p => this.mapDates(p)))
    );
  }

  getPredefinedPresets(filterType: string): Observable<FilterPreset[]> {
    return this.http.get<FilterPreset[]>(`${this.apiUrl}/predefined`, {
      params: { filterType }
    }).pipe(
      map(presets => presets.map(p => this.mapDates(p)))
    );
  }

  getUserPresets(filterType: string): Observable<FilterPreset[]> {
    return this.http.get<FilterPreset[]>(`${this.apiUrl}/user`, {
      params: { filterType }
    }).pipe(
      map(presets => presets.map(p => this.mapDates(p)))
    );
  }

  update(id: number, request: FilterPresetRequest): Observable<FilterPreset> {
    return this.http.put<FilterPreset>(`${this.apiUrl}/${id}`, request).pipe(
      map(preset => this.mapDates(preset))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private mapDates(preset: FilterPreset): FilterPreset {
    return {
      ...preset,
      createdAt: preset.createdAt ? new Date(preset.createdAt) : undefined,
      updatedAt: preset.updatedAt ? new Date(preset.updatedAt) : undefined
    };
  }

  savePresetLocally(context: string, name: string, filters: Record<string, unknown>): void {
    const preset: FilterPreset = {
      name,
      filterType: context,
      filterConfig: filters,
      createdAt: new Date()
    };

    const presets = this.getPresetsLocally(context);
    presets.push(preset);
    
    localStorage.setItem(
      this.getStorageKey(context),
      JSON.stringify(presets)
    );
  }

  getPresetsLocally(context: string): FilterPreset[] {
    const data = localStorage.getItem(this.getStorageKey(context));
    if (!data) return [];

    try {
      const presets = JSON.parse(data);
      return presets.map((p: FilterPreset) => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined
      }));
    } catch {
      return [];
    }
  }

  deletePresetLocally(context: string, name: string): void {
    const presets = this.getPresetsLocally(context).filter(p => p.name !== name);
    localStorage.setItem(
      this.getStorageKey(context),
      JSON.stringify(presets)
    );
  }

  private getStorageKey(context: string): string {
    return `${this.STORAGE_KEY_PREFIX}${context}`;
  }
}
