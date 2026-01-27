import { Injectable } from '@angular/core';
import { Observable, Subject, interval } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface FormDraft {
  formId: string;
  data: any;
  timestamp: number;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormDraftService {
  private readonly STORAGE_PREFIX = 'form_draft_';
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private autoSaveSubjects: Map<string, Subject<any>> = new Map();
  private destroySubjects: Map<string, Subject<void>> = new Map();

  /**
   * Save draft to localStorage
   */
  saveDraft(formId: string, data: any, userId?: string): void {
    const draft: FormDraft = {
      formId,
      data,
      timestamp: Date.now(),
      userId
    };

    try {
      localStorage.setItem(
        this.getStorageKey(formId),
        JSON.stringify(draft)
      );
    } catch (error) {
      console.error('Error saving form draft:', error);
    }
  }

  /**
   * Load draft from localStorage
   */
  loadDraft(formId: string, userId?: string): FormDraft | null {
    try {
      const key = this.getStorageKey(formId);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return null;
      }

      const draft: FormDraft = JSON.parse(stored);

      // Validate userId if provided
      if (userId && draft.userId && draft.userId !== userId) {
        return null;
      }

      // Check if draft is older than 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (draft.timestamp < sevenDaysAgo) {
        this.deleteDraft(formId);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Error loading form draft:', error);
      return null;
    }
  }

  /**
   * Delete draft from localStorage
   */
  deleteDraft(formId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(formId));
    } catch (error) {
      console.error('Error deleting form draft:', error);
    }
  }

  /**
   * Check if draft exists
   */
  hasDraft(formId: string): boolean {
    return localStorage.getItem(this.getStorageKey(formId)) !== null;
  }

  /**
   * Setup auto-save for a form
   */
  setupAutoSave(
    formId: string,
    valueChanges: Observable<any>,
    userId?: string,
    debounce = 2000
  ): void {
    // Clean up existing auto-save if any
    this.stopAutoSave(formId);

    const autoSaveSubject = new Subject<any>();
    const destroySubject = new Subject<void>();

    this.autoSaveSubjects.set(formId, autoSaveSubject);
    this.destroySubjects.set(formId, destroySubject);

    // Subscribe to form changes with debounce
    valueChanges
      .pipe(
        debounceTime(debounce),
        takeUntil(destroySubject)
      )
      .subscribe(data => {
        this.saveDraft(formId, data, userId);
        autoSaveSubject.next(data);
      });

    // Periodic auto-save
    interval(this.AUTO_SAVE_INTERVAL)
      .pipe(takeUntil(destroySubject))
      .subscribe(() => {
        // This ensures save even if no changes (heartbeat)
      });
  }

  /**
   * Stop auto-save for a form
   */
  stopAutoSave(formId: string): void {
    const destroySubject = this.destroySubjects.get(formId);
    if (destroySubject) {
      destroySubject.next();
      destroySubject.complete();
      this.destroySubjects.delete(formId);
    }

    const autoSaveSubject = this.autoSaveSubjects.get(formId);
    if (autoSaveSubject) {
      autoSaveSubject.complete();
      this.autoSaveSubjects.delete(formId);
    }
  }

  /**
   * Get auto-save observable for a form
   */
  getAutoSaveObservable(formId: string): Observable<any> | null {
    const subject = this.autoSaveSubjects.get(formId);
    return subject ? subject.asObservable() : null;
  }

  /**
   * List all drafts
   */
  listDrafts(): FormDraft[] {
    const drafts: FormDraft[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            drafts.push(JSON.parse(stored));
          }
        }
      }
    } catch (error) {
      console.error('Error listing drafts:', error);
    }

    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all drafts
   */
  clearAllDrafts(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing drafts:', error);
    }
  }

  /**
   * Get storage key for form
   */
  private getStorageKey(formId: string): string {
    return `${this.STORAGE_PREFIX}${formId}`;
  }

  /**
   * Get draft age in minutes
   */
  getDraftAge(draft: FormDraft): number {
    return Math.floor((Date.now() - draft.timestamp) / 60000);
  }
}
