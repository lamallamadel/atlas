import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Module Coop habitat (module.coop_habitat) : groupement, membres, projets, lots, cotisations. */

export type CoopMemberStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CoopProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type CoopLotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type CoopContributionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type CoopContributionType = 'INITIAL' | 'MONTHLY' | 'SPECIAL' | 'CAPITAL';

export interface CoopPage<T> {
  content: T[];
  totalElements: number;
}

export interface CoopGroup {
  id: number;
  name: string;
  description?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  createdAt?: string;
}
export type CoopGroupRequest = Omit<CoopGroup, 'id' | 'createdAt'>;

export interface CoopMember {
  id: number;
  groupId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  memberNumber?: string | null;
  joinDate?: string | null;
  status: CoopMemberStatus;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  meta?: Record<string, unknown> | null;
}
export type CoopMemberRequest = Omit<CoopMember, 'id'>;

export interface CoopProject {
  id: number;
  groupId: number;
  name: string;
  description?: string | null;
  location?: string | null;
  city?: string | null;
  postalCode?: string | null;
  status: CoopProjectStatus;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  completionDate?: string | null;
  totalBudget?: number | null;
  currency?: string | null;
  meta?: Record<string, unknown> | null;
}
export type CoopProjectRequest = Omit<CoopProject, 'id'>;

export interface CoopLot {
  id: number;
  projectId: number;
  memberId?: number | null;
  lotNumber: string;
  description?: string | null;
  surfaceArea?: number | null;
  floorNumber?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price?: number | null;
  currency?: string | null;
  status: CoopLotStatus;
  meta?: Record<string, unknown> | null;
}
export type CoopLotRequest = Omit<CoopLot, 'id'>;

export interface CoopContribution {
  id: number;
  memberId: number;
  projectId?: number | null;
  type: CoopContributionType;
  amount: number;
  currency: string;
  status: CoopContributionStatus;
  dueDate?: string | null;
  paymentDate?: string | null;
  referenceNumber?: string | null;
  description?: string | null;
  meta?: Record<string, unknown> | null;
}
export type CoopContributionRequest = Omit<CoopContribution, 'id'>;

export const MEMBER_STATUS_LABELS: Record<CoopMemberStatus, string> = {
  PENDING: 'En attente', ACTIVE: 'Actif', INACTIVE: 'Inactif', SUSPENDED: 'Suspendu',
};
export const PROJECT_STATUS_LABELS: Record<CoopProjectStatus, string> = {
  PLANNING: 'En préparation', IN_PROGRESS: 'En cours', COMPLETED: 'Livré', ON_HOLD: 'En pause', CANCELLED: 'Annulé',
};
export const LOT_STATUS_LABELS: Record<CoopLotStatus, string> = {
  AVAILABLE: 'Disponible', RESERVED: 'Attribué', SOLD: 'Livré',
};
export const CONTRIBUTION_STATUS_LABELS: Record<CoopContributionStatus, string> = {
  PENDING: 'À payer', PAID: 'Payée', OVERDUE: 'En retard', CANCELLED: 'Annulée',
};
export const CONTRIBUTION_TYPE_LABELS: Record<CoopContributionType, string> = {
  INITIAL: 'Apport initial', MONTHLY: 'Mensualité', SPECIAL: 'Appel exceptionnel', CAPITAL: 'Capital',
};

/** Montant lisible en dirhams (ou dans la devise donnée). */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: currency || 'MAD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency || 'MAD'}`;
  }
}

@Injectable({ providedIn: 'root' })
export class CoopApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/coop';

  private page<T>(path: string, filters: Record<string, string | number | undefined> = {}): Observable<CoopPage<T>> {
    let params = new HttpParams().set('size', 500).set('sort', 'id,asc');
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<CoopPage<T>>(`${this.base}/${path}`, { params });
  }

  groups(): Observable<CoopGroup[]> {
    return this.page<CoopGroup>('groups').pipe(map(p => p.content));
  }
  /** Nombre de groupements (lien de navigation). */
  groupCount(): Observable<number> {
    return this.http.get<CoopPage<CoopGroup>>(`${this.base}/groups`, { params: { size: 1 } }).pipe(map(p => p.totalElements));
  }
  group(id: number): Observable<CoopGroup> {
    return this.http.get<CoopGroup>(`${this.base}/groups/${id}`);
  }
  createGroup(r: CoopGroupRequest): Observable<CoopGroup> {
    return this.http.post<CoopGroup>(`${this.base}/groups`, r);
  }

  members(groupId: number): Observable<CoopMember[]> {
    return this.page<CoopMember>('members', { groupId }).pipe(map(p => p.content));
  }
  createMember(r: CoopMemberRequest): Observable<CoopMember> {
    return this.http.post<CoopMember>(`${this.base}/members`, r);
  }
  updateMember(id: number, r: CoopMemberRequest): Observable<CoopMember> {
    return this.http.put<CoopMember>(`${this.base}/members/${id}`, r);
  }

  projects(groupId: number): Observable<CoopProject[]> {
    return this.page<CoopProject>('projects', { groupId }).pipe(map(p => p.content));
  }
  createProject(r: CoopProjectRequest): Observable<CoopProject> {
    return this.http.post<CoopProject>(`${this.base}/projects`, r);
  }
  updateProject(id: number, r: CoopProjectRequest): Observable<CoopProject> {
    return this.http.put<CoopProject>(`${this.base}/projects/${id}`, r);
  }

  lots(projectId: number): Observable<CoopLot[]> {
    return this.page<CoopLot>('lots', { projectId }).pipe(map(p => p.content));
  }
  createLot(r: CoopLotRequest): Observable<CoopLot> {
    return this.http.post<CoopLot>(`${this.base}/lots`, r);
  }
  updateLot(id: number, r: CoopLotRequest): Observable<CoopLot> {
    return this.http.put<CoopLot>(`${this.base}/lots/${id}`, r);
  }

  /** Journal des cotisations de tout le groupement. */
  contributions(groupId: number): Observable<CoopContribution[]> {
    return this.page<CoopContribution>('contributions', { groupId }).pipe(map(p => p.content));
  }
  createContribution(r: CoopContributionRequest): Observable<CoopContribution> {
    return this.http.post<CoopContribution>(`${this.base}/contributions`, r);
  }
  updateContribution(id: number, r: CoopContributionRequest): Observable<CoopContribution> {
    return this.http.put<CoopContribution>(`${this.base}/contributions/${id}`, r);
  }
}

/** Corps de mise à jour à partir d'une réponse (l'API attend la ressource complète). */
export function toRequest<T extends { id: number }>(entity: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = entity as T & { createdAt?: unknown; updatedAt?: unknown };
  delete (rest as Record<string, unknown>)['createdAt'];
  delete (rest as Record<string, unknown>)['updatedAt'];
  return rest as Omit<T, 'id'>;
}
