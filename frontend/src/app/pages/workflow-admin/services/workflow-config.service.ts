import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkflowConfiguration, WorkflowNode, TransitionRule, CaseType } from '../models/workflow.model';
import { DossierStatus } from '../../../services/dossier-api.service';
import { AnnonceStatus } from '../../../services/annonce-api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowConfigService {
  private workflowSubject = new BehaviorSubject<WorkflowConfiguration | null>(null);
  public workflow$ = this.workflowSubject.asObservable();

  private dossierDefaultConfig: WorkflowConfiguration = {
    caseType: CaseType.DOSSIER,
    name: 'Dossier Workflow',
    description: 'Default workflow for dossier management',
    nodes: [
      { id: '1', label: 'Nouveau', status: DossierStatus.NEW, x: 100, y: 200, color: '#2196F3', icon: 'fiber_new' },
      { id: '2', label: 'Qualification', status: DossierStatus.QUALIFYING, x: 350, y: 200, color: '#FF9800', icon: 'assignment' },
      { id: '3', label: 'Qualifié', status: DossierStatus.QUALIFIED, x: 600, y: 200, color: '#9C27B0', icon: 'check_circle' },
      { id: '4', label: 'Rendez-vous', status: DossierStatus.APPOINTMENT, x: 850, y: 200, color: '#00BCD4', icon: 'event' },
      { id: '5', label: 'Gagné', status: DossierStatus.WON, x: 725, y: 50, color: '#4CAF50', icon: 'star' },
      { id: '6', label: 'Perdu', status: DossierStatus.LOST, x: 725, y: 350, color: '#F44336', icon: 'cancel' }
    ],
    transitions: [
      {
        id: 't1',
        fromStatus: DossierStatus.NEW,
        toStatus: DossierStatus.QUALIFYING,
        label: 'Commencer qualification',
        requiredFields: ['leadName', 'leadPhone'],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't2',
        fromStatus: DossierStatus.QUALIFYING,
        toStatus: DossierStatus.QUALIFIED,
        label: 'Marquer comme qualifié',
        requiredFields: ['leadName', 'leadPhone', 'leadSource'],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't3',
        fromStatus: DossierStatus.QUALIFIED,
        toStatus: DossierStatus.APPOINTMENT,
        label: 'Planifier rendez-vous',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't4',
        fromStatus: DossierStatus.APPOINTMENT,
        toStatus: DossierStatus.WON,
        label: 'Marquer comme gagné',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN'],
        requiresApproval: true
      },
      {
        id: 't5',
        fromStatus: DossierStatus.APPOINTMENT,
        toStatus: DossierStatus.LOST,
        label: 'Marquer comme perdu',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't6',
        fromStatus: DossierStatus.QUALIFYING,
        toStatus: DossierStatus.LOST,
        label: 'Abandonner',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      }
    ]
  };

  private annonceDefaultConfig: WorkflowConfiguration = {
    caseType: CaseType.ANNONCE,
    name: 'Annonce Workflow',
    description: 'Default workflow for annonce management',
    nodes: [
      { id: '1', label: 'Brouillon', status: AnnonceStatus.DRAFT, x: 100, y: 200, color: '#9E9E9E', icon: 'drafts' },
      { id: '2', label: 'Publié', status: AnnonceStatus.PUBLISHED, x: 350, y: 200, color: '#2196F3', icon: 'publish' },
      { id: '3', label: 'Actif', status: AnnonceStatus.ACTIVE, x: 600, y: 200, color: '#4CAF50', icon: 'check_circle' },
      { id: '4', label: 'En pause', status: AnnonceStatus.PAUSED, x: 600, y: 350, color: '#FF9800', icon: 'pause_circle' },
      { id: '5', label: 'Archivé', status: AnnonceStatus.ARCHIVED, x: 850, y: 275, color: '#757575', icon: 'archive' }
    ],
    transitions: [
      {
        id: 't1',
        fromStatus: AnnonceStatus.DRAFT,
        toStatus: AnnonceStatus.PUBLISHED,
        label: 'Publier',
        requiredFields: ['title', 'description', 'price', 'city'],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't2',
        fromStatus: AnnonceStatus.PUBLISHED,
        toStatus: AnnonceStatus.ACTIVE,
        label: 'Activer',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't3',
        fromStatus: AnnonceStatus.ACTIVE,
        toStatus: AnnonceStatus.PAUSED,
        label: 'Mettre en pause',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't4',
        fromStatus: AnnonceStatus.PAUSED,
        toStatus: AnnonceStatus.ACTIVE,
        label: 'Reprendre',
        requiredFields: [],
        allowedRoles: ['AGENT', 'ADMIN']
      },
      {
        id: 't5',
        fromStatus: AnnonceStatus.ACTIVE,
        toStatus: AnnonceStatus.ARCHIVED,
        label: 'Archiver',
        requiredFields: [],
        allowedRoles: ['ADMIN']
      },
      {
        id: 't6',
        fromStatus: AnnonceStatus.PAUSED,
        toStatus: AnnonceStatus.ARCHIVED,
        label: 'Archiver',
        requiredFields: [],
        allowedRoles: ['ADMIN']
      }
    ]
  };

  constructor() {
    this.workflowSubject.next(this.dossierDefaultConfig);
  }

  getCurrentWorkflow(): WorkflowConfiguration | null {
    return this.workflowSubject.value;
  }

  loadWorkflow(caseType: CaseType): void {
    const config = caseType === CaseType.DOSSIER 
      ? this.dossierDefaultConfig 
      : this.annonceDefaultConfig;
    this.workflowSubject.next({ ...config });
  }

  updateWorkflow(workflow: WorkflowConfiguration): void {
    this.workflowSubject.next(workflow);
  }

  updateNode(nodeId: string, updates: Partial<WorkflowNode>): void {
    const current = this.getCurrentWorkflow();
    if (!current) return;

    const nodes = current.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );

    this.workflowSubject.next({ ...current, nodes });
  }

  addTransition(transition: TransitionRule): void {
    const current = this.getCurrentWorkflow();
    if (!current) return;

    this.workflowSubject.next({
      ...current,
      transitions: [...current.transitions, transition]
    });
  }

  updateTransition(transitionId: string, updates: Partial<TransitionRule>): void {
    const current = this.getCurrentWorkflow();
    if (!current) return;

    const transitions = current.transitions.map(t =>
      t.id === transitionId ? { ...t, ...updates } : t
    );

    this.workflowSubject.next({ ...current, transitions });
  }

  deleteTransition(transitionId: string): void {
    const current = this.getCurrentWorkflow();
    if (!current) return;

    const transitions = current.transitions.filter(t => t.id !== transitionId);
    this.workflowSubject.next({ ...current, transitions });
  }

  getTransitionsFromStatus(status: string): TransitionRule[] {
    const current = this.getCurrentWorkflow();
    if (!current) return [];
    return current.transitions.filter(t => t.fromStatus === status);
  }

  getTransitionsToStatus(status: string): TransitionRule[] {
    const current = this.getCurrentWorkflow();
    if (!current) return [];
    return current.transitions.filter(t => t.toStatus === status);
  }

  saveWorkflow(): Observable<WorkflowConfiguration> {
    return new Observable(observer => {
      const current = this.getCurrentWorkflow();
      if (current) {
        const saved = { 
          ...current, 
          id: current.id || `wf-${Date.now()}`,
          updatedAt: new Date().toISOString() 
        };
        this.workflowSubject.next(saved);
        observer.next(saved);
      }
      observer.complete();
    });
  }
}
