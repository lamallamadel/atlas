import { TestBed } from '@angular/core/testing';
import { FormDraftService, FormDraft } from './form-draft.service';
import { of } from 'rxjs';

describe('FormDraftService', () => {
  let service: FormDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormDraftService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save draft to localStorage', () => {
    const formId = 'test-form';
    const data = { name: 'John', email: 'john@example.com' };
    
    service.saveDraft(formId, data);
    
    const stored = localStorage.getItem('form_draft_test-form');
    expect(stored).toBeTruthy();
    
    const draft: FormDraft = JSON.parse(stored!);
    expect(draft.formId).toBe(formId);
    expect(draft.data).toEqual(data);
    expect(draft.timestamp).toBeDefined();
  });

  it('should load draft from localStorage', () => {
    const formId = 'test-form';
    const data = { name: 'John', email: 'john@example.com' };
    
    service.saveDraft(formId, data);
    const loaded = service.loadDraft(formId);
    
    expect(loaded).toBeTruthy();
    expect(loaded!.data).toEqual(data);
  });

  it('should delete draft from localStorage', () => {
    const formId = 'test-form';
    const data = { name: 'John' };
    
    service.saveDraft(formId, data);
    expect(service.hasDraft(formId)).toBe(true);
    
    service.deleteDraft(formId);
    expect(service.hasDraft(formId)).toBe(false);
  });

  it('should check if draft exists', () => {
    const formId = 'test-form';
    
    expect(service.hasDraft(formId)).toBe(false);
    
    service.saveDraft(formId, { name: 'John' });
    expect(service.hasDraft(formId)).toBe(true);
  });

  it('should not load draft older than 7 days', () => {
    const formId = 'test-form';
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    
    const oldDraft: FormDraft = {
      formId,
      data: { name: 'John' },
      timestamp: eightDaysAgo
    };
    
    localStorage.setItem('form_draft_test-form', JSON.stringify(oldDraft));
    
    const loaded = service.loadDraft(formId);
    expect(loaded).toBeNull();
    expect(service.hasDraft(formId)).toBe(false);
  });

  it('should list all drafts', () => {
    service.saveDraft('form1', { data: 'test1' });
    service.saveDraft('form2', { data: 'test2' });
    
    const drafts = service.listDrafts();
    expect(drafts.length).toBe(2);
  });

  it('should clear all drafts', () => {
    service.saveDraft('form1', { data: 'test1' });
    service.saveDraft('form2', { data: 'test2' });
    
    service.clearAllDrafts();
    
    const drafts = service.listDrafts();
    expect(drafts.length).toBe(0);
  });

  it('should calculate draft age in minutes', () => {
    const draft: FormDraft = {
      formId: 'test',
      data: {},
      timestamp: Date.now() - (5 * 60 * 1000) // 5 minutes ago
    };
    
    const age = service.getDraftAge(draft);
    expect(age).toBeGreaterThanOrEqual(4);
    expect(age).toBeLessThanOrEqual(6);
  });

  it('should stop auto-save', () => {
    const formId = 'test-form';
    service.setupAutoSave(formId, of({ test: 'data' }));
    service.stopAutoSave(formId);
    
    const observable = service.getAutoSaveObservable(formId);
    expect(observable).toBeNull();
  });
});
