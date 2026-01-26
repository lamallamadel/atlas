import { TestBed } from '@angular/core/testing';
import { QuickActionsService, RecentAction } from './quick-actions.service';

describe('QuickActionsService', () => {
  let service: QuickActionsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add recent action', () => {
    const action: RecentAction = {
      dossierId: 1,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    };

    service.addRecentAction(action);
    const actions = service.getRecentActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toEqual(action);
  });

  it('should limit recent actions to MAX_RECENT_ACTIONS', () => {
    for (let i = 0; i < 10; i++) {
      service.addRecentAction({
        dossierId: i,
        actionId: 'test-action',
        actionLabel: `Action ${i}`,
        timestamp: new Date().toISOString()
      });
    }

    const actions = service.getRecentActions();
    expect(actions.length).toBe(5);
  });

  it('should filter recent actions by dossier ID', () => {
    service.addRecentAction({
      dossierId: 1,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    });

    service.addRecentAction({
      dossierId: 2,
      actionId: 'send-message',
      actionLabel: 'Message envoyé',
      timestamp: new Date().toISOString()
    });

    const dossier1Actions = service.getRecentActions(1);
    expect(dossier1Actions.length).toBe(1);
    expect(dossier1Actions[0].dossierId).toBe(1);
  });

  it('should clear all recent actions', () => {
    service.addRecentAction({
      dossierId: 1,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    });

    service.clearRecentActions();
    const actions = service.getRecentActions();
    expect(actions.length).toBe(0);
  });

  it('should clear actions for specific dossier', () => {
    service.addRecentAction({
      dossierId: 1,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    });

    service.addRecentAction({
      dossierId: 2,
      actionId: 'send-message',
      actionLabel: 'Message envoyé',
      timestamp: new Date().toISOString()
    });

    service.clearDossierActions(1);
    const actions = service.getRecentActions();
    expect(actions.length).toBe(1);
    expect(actions[0].dossierId).toBe(2);
  });

  it('should persist to localStorage', () => {
    const action: RecentAction = {
      dossierId: 1,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    };

    service.addRecentAction(action);
    const stored = localStorage.getItem('quick_actions_history');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.length).toBe(1);
      expect(parsed[0].dossierId).toBe(1);
    }
  });
});
