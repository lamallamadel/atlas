import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MediaAnalysisStatus = 'PENDING' | 'DONE' | 'FAILED' | 'REJECTED';
export type VisionStatus = 'EMPTY' | 'RUNNING' | 'PENDING' | 'DONE';

/** Analyse d'UNE photo par le brain (voir brain/vision/schemas.py). */
export interface PhotoAnalysis {
  is_property_photo: boolean;
  room_type: string;
  caption?: string;
  equipments?: string[];
  materials?: { surface: string; material: string }[];
  furniture?: { item: string; count: number }[];
  condition?: string;
  condition_signs?: string[];
  era?: { from_year: number | null; to_year: number | null; rationale: string };
  area_m2_min?: number | null;
  area_m2_max?: number | null;
  dimension_reference?: string | null;
  view?: string | null;
  natural_light?: string;
  confidence?: number;
}

export interface AnnonceMedia {
  id: number;
  annonceId: number;
  mediaType: string;
  source: 'UPLOAD' | 'URL';
  /** Pour UPLOAD : chemin de l'API (à charger avec le jeton). Pour URL : lien externe. */
  url: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  position: number;
  analysisStatus: MediaAnalysisStatus;
  analysis?: PhotoAnalysis | null;
  analysisEngine?: string | null;
  analysisError?: string | null;
  analyzedAt?: string | null;
}

export interface VisionRoom {
  room_type: string;
  label: string;
  photos: number;
  area_m2_min: number | null;
  area_m2_max: number | null;
  furniture: { item: string; count: number }[];
  condition: string | null;
}

export interface VisionProfile {
  photos_analysees: number;
  photos_du_bien: number;
  pieces: VisionRoom[];
  equipements: { label: string; photos: number }[];
  materiaux: { surface: string; material: string; photos: number }[];
  meuble: boolean | null;
  etat_general: string | null;
  signes_etat: string[];
  epoque: { from_year: number | null; to_year: number | null } | null;
  vues: string[];
  lumiere: string | null;
}

export interface VisionResult {
  profile: VisionProfile;
  inconsistencies: string[];
  descriptions: Record<string, string>;
  description_engine: string;
}

export interface VisionStatusResponse {
  status: VisionStatus;
  total: number;
  done: number;
  pending: number;
  failed: number;
  rejected: number;
  media: AnnonceMedia[];
  result: VisionResult | null;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnnonceMediaApiService {
  constructor(private http: HttpClient) {}

  private base(annonceId: number): string {
    return `/api/v1/annonces/${annonceId}`;
  }

  upload(annonceId: number, files: File[]): Observable<AnnonceMedia[]> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f, f.name));
    return this.http.post<AnnonceMedia[]>(`${this.base(annonceId)}/media`, form);
  }

  delete(annonceId: number, mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.base(annonceId)}/media/${mediaId}`);
  }

  /** Les photos importées sont protégées : on les charge avec le jeton, puis on en fait une URL locale. */
  content(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  analyze(annonceId: number, force = false): Observable<VisionStatusResponse> {
    const params = new HttpParams().set('force', String(force));
    return this.http.post<VisionStatusResponse>(`${this.base(annonceId)}/vision/analyze`, null, { params });
  }

  status(annonceId: number): Observable<VisionStatusResponse> {
    return this.http.get<VisionStatusResponse>(`${this.base(annonceId)}/vision`);
  }

  applyDescription(annonceId: number, description: string): Observable<void> {
    return this.http.post<void>(`${this.base(annonceId)}/vision/apply-description`, { description });
  }
}
