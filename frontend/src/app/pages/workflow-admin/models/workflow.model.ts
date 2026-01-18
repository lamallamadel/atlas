export enum CaseType {
  DOSSIER = 'DOSSIER',
  ANNONCE = 'ANNONCE'
}

export interface WorkflowNode {
  id: string;
  label: string;
  status: string;
  x: number;
  y: number;
  color?: string;
  icon?: string;
}

export interface TransitionRule {
  id: string;
  fromStatus: string;
  toStatus: string;
  label?: string;
  requiredFields?: string[];
  allowedRoles?: string[];
  requiresApproval?: boolean;
  conditions?: string;
}

export interface WorkflowConfiguration {
  id?: string;
  caseType: CaseType;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  transitions: TransitionRule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowPreviewState {
  currentStatus: string;
  availableTransitions: TransitionRule[];
  history: WorkflowHistoryEntry[];
}

export interface WorkflowHistoryEntry {
  fromStatus: string;
  toStatus: string;
  timestamp: Date;
  user?: string;
}
