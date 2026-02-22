import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkflowState {
  stateCode: string;
  stateName: string;
  stateType: 'initial' | 'intermediate' | 'final';
  color: string;
  positionX: number;
  positionY: number;
  isInitial: boolean;
  isFinal: boolean;
  description?: string;
}

export interface WorkflowTransition {
  fromState: string;
  toState: string;
  label: string;
  requiredFields: string[];
  allowedRoles: string[];
  isActive: boolean;
  priority?: number;
  conditionsJson?: any;
  actionsJson?: any[];
}

export interface WorkflowDefinition {
  id?: number;
  orgId?: string;
  name: string;
  description?: string;
  caseType: string;
  version?: number;
  isActive: boolean;
  isPublished: boolean;
  isTemplate?: boolean;
  templateCategory?: string;
  parentVersionId?: number;
  statesJson: WorkflowState[];
  transitionsJson: WorkflowTransition[];
  metadataJson?: any;
  initialState: string;
  finalStates: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  caseType: string;
  stateCount: number;
  transitionCount: number;
}

export interface WorkflowSimulationRequest {
  workflowDefinitionId: number;
  simulationName: string;
  currentState: string;
  testDataJson: any;
}

export interface WorkflowSimulationResponse {
  id: number;
  workflowDefinitionId: number;
  simulationName: string;
  currentState: string;
  testDataJson: any;
  executionLog: any[];
  status: string;
  resultJson: any;
  createdAt: Date;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowApiService {
  private apiUrl = '/api/v1/workflow';

  constructor(private http: HttpClient) {}

  createWorkflow(workflow: WorkflowDefinition): Observable<WorkflowDefinition> {
    return this.http.post<WorkflowDefinition>(`${this.apiUrl}/definitions`, workflow);
  }

  getWorkflowById(id: number): Observable<WorkflowDefinition> {
    return this.http.get<WorkflowDefinition>(`${this.apiUrl}/definitions/${id}`);
  }

  listWorkflows(
    caseType?: string,
    isActive?: boolean,
    isPublished?: boolean,
    page = 0,
    size = 20
  ): Observable<PageResponse<WorkflowDefinition>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (caseType) {
      params = params.set('caseType', caseType);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (isPublished !== undefined) {
      params = params.set('isPublished', isPublished.toString());
    }

    return this.http.get<PageResponse<WorkflowDefinition>>(`${this.apiUrl}/definitions`, { params });
  }

  getVersionsByCaseType(caseType: string): Observable<WorkflowDefinition[]> {
    return this.http.get<WorkflowDefinition[]>(`${this.apiUrl}/definitions/case-type/${caseType}`);
  }

  updateWorkflow(id: number, workflow: WorkflowDefinition): Observable<WorkflowDefinition> {
    return this.http.put<WorkflowDefinition>(`${this.apiUrl}/definitions/${id}`, workflow);
  }

  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/definitions/${id}`);
  }

  publishWorkflow(id: number): Observable<WorkflowDefinition> {
    return this.http.post<WorkflowDefinition>(`${this.apiUrl}/definitions/${id}/publish`, {});
  }

  activateWorkflow(id: number): Observable<WorkflowDefinition> {
    return this.http.post<WorkflowDefinition>(`${this.apiUrl}/definitions/${id}/activate`, {});
  }

  createNewVersion(id: number, description?: string): Observable<WorkflowDefinition> {
    let params = new HttpParams();
    if (description) {
      params = params.set('description', description);
    }
    return this.http.post<WorkflowDefinition>(`${this.apiUrl}/definitions/${id}/version`, {}, { params });
  }

  listTemplates(category?: string): Observable<WorkflowTemplate[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<WorkflowTemplate[]>(`${this.apiUrl}/templates`, { params });
  }

  instantiateTemplate(templateId: number, name?: string): Observable<WorkflowDefinition> {
    let params = new HttpParams();
    if (name) {
      params = params.set('name', name);
    }
    return this.http.post<WorkflowDefinition>(`${this.apiUrl}/templates/${templateId}/instantiate`, {}, { params });
  }

  seedTemplates(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/templates/seed`, {});
  }

  runSimulation(request: WorkflowSimulationRequest): Observable<WorkflowSimulationResponse> {
    return this.http.post<WorkflowSimulationResponse>(`${this.apiUrl}/simulations`, request);
  }

  getSimulationById(id: number): Observable<WorkflowSimulationResponse> {
    return this.http.get<WorkflowSimulationResponse>(`${this.apiUrl}/simulations/${id}`);
  }

  getSimulationHistory(workflowDefinitionId: number): Observable<WorkflowSimulationResponse[]> {
    return this.http.get<WorkflowSimulationResponse[]>(`${this.apiUrl}/simulations/workflow/${workflowDefinitionId}`);
  }

  validateTransition(dossierId: number, fromStatus: string, toStatus: string): Observable<any> {
    const params = new HttpParams()
      .set('fromStatus', fromStatus)
      .set('toStatus', toStatus);
    return this.http.get<any>(`${this.apiUrl}/validate-transition/dossier/${dossierId}`, { params });
  }

  getAllowedTransitions(caseType: string, currentStatus: string): Observable<string[]> {
    const params = new HttpParams()
      .set('caseType', caseType)
      .set('currentStatus', currentStatus);
    return this.http.get<string[]>(`${this.apiUrl}/allowed-transitions`, { params });
  }
}
