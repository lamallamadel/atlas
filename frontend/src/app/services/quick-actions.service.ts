import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  shortcut: string;
  color: 'primary' | 'accent' | 'warn';
  disabled?: boolean;
  action: () => void;
}

export interface RecentAction {
  dossierId: number;
  actionId: string;
  actionLabel: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class QuickActionsService {
  private readonly STORAGE_KEY = 'quick_actions_history';
  private readonly MAX_RECENT_ACTIONS = 5;
  
  private recentActionsSubject = new BehaviorSubject<RecentAction[]>([]);
  public recentActions$ = this.recentActionsSubject.asObservable();

  constructor() {
    this.loadRecentActions();
  }

  private loadRecentActions(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const actions = JSON.parse(stored) as RecentAction[];
        this.recentActionsSubject.next(actions);
      } catch (e) {
        console.error('Failed to load recent actions', e);
        this.recentActionsSubject.next([]);
      }
    }
  }

  addRecentAction(action: RecentAction): void {
    const currentActions = this.recentActionsSubject.value;
    
    const filteredActions = currentActions.filter(
      a => !(a.dossierId === action.dossierId && a.actionId === action.actionId)
    );
    
    const updatedActions = [action, ...filteredActions].slice(0, this.MAX_RECENT_ACTIONS);
    
    this.recentActionsSubject.next(updatedActions);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedActions));
  }

  getRecentActions(dossierId?: number): RecentAction[] {
    const actions = this.recentActionsSubject.value;
    if (dossierId !== undefined) {
      return actions.filter(a => a.dossierId === dossierId);
    }
    return actions;
  }

  clearRecentActions(): void {
    this.recentActionsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  clearDossierActions(dossierId: number): void {
    const currentActions = this.recentActionsSubject.value;
    const filteredActions = currentActions.filter(a => a.dossierId !== dossierId);
    this.recentActionsSubject.next(filteredActions);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredActions));
  }
}
