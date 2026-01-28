export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
  COMPLETED = 'COMPLETED'
}

export enum WorkflowStepType {
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  SIGNATURE = 'SIGNATURE',
  ARCHIVE = 'ARCHIVE',
  NOTIFICATION = 'NOTIFICATION',
  CONDITIONAL_BRANCH = 'CONDITIONAL_BRANCH',
  PARALLEL_EXECUTION = 'PARALLEL_EXECUTION'
}

export enum DocumentWorkflowType {
  PURCHASE_AGREEMENT = 'PURCHASE_AGREEMENT',
  LEASE_CONTRACT = 'LEASE_CONTRACT',
  MANDATE = 'MANDATE',
  AMENDMENT = 'AMENDMENT',
  DISCLOSURE = 'DISCLOSURE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  APPRAISAL = 'APPRAISAL',
  CUSTOM = 'CUSTOM'
}

export enum DocumentActionType {
  UPLOADED = 'UPLOADED',
  VIEWED = 'VIEWED',
  DOWNLOADED = 'DOWNLOADED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SIGNED = 'SIGNED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  VERSION_CREATED = 'VERSION_CREATED',
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
  WORKFLOW_CANCELLED = 'WORKFLOW_CANCELLED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  SHARED = 'SHARED'
}

export interface DocumentWorkflow {
  id: number;
  documentId: number;
  dossierId?: number;
  templateId?: number;
  workflowName: string;
  workflowType: DocumentWorkflowType;
  status: WorkflowStatus;
  currentStepOrder?: number;
  workflowConfig?: any;
  contextData?: any;
  initiatedBy: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  propertyValue?: number;
  requiresAdditionalApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: number;
  workflowId: number;
  stepName: string;
  stepDescription?: string;
  stepType: WorkflowStepType;
  stepOrder: number;
  status: WorkflowStepStatus;
  assignedApprovers?: string[];
  approvalsRequired?: number;
  approvalsReceived: number;
  stepConfig?: any;
  conditionRules?: any;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  isParallel: boolean;
  requiresAllApprovers: boolean;
}

export interface WorkflowApproval {
  id: number;
  workflowId: number;
  stepId: number;
  approverId: string;
  approverName?: string;
  approverEmail?: string;
  decision?: WorkflowStepStatus;
  comments?: string;
  reason?: string;
  decidedAt?: string;
  notifiedAt?: string;
  reminderSentAt?: string;
  reminderCount: number;
}

export interface DocumentAudit {
  id: number;
  documentId: number;
  workflowId?: number;
  versionId?: number;
  actionType: DocumentActionType;
  actionBy: string;
  actionAt: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  storagePath: string;
  contentType?: string;
  checksum?: string;
  versionNotes?: string;
  isCurrent: boolean;
  metadata?: any;
  uploadedBy: string;
  createdAt: string;
}

export interface WorkflowTemplate {
  id: number;
  templateName: string;
  description?: string;
  workflowType: DocumentWorkflowType;
  stepsDefinition: any[];
  defaultConfig?: any;
  isSystemTemplate: boolean;
  isActive: boolean;
  usageCount: number;
  category?: string;
  tags?: string;
}

export interface CreateWorkflowRequest {
  documentId: number;
  dossierId?: number;
  templateId?: number;
  workflowName: string;
  workflowType: DocumentWorkflowType;
  workflowConfig?: any;
  contextData?: any;
  propertyValue?: number;
}

export interface ApprovalDecisionRequest {
  decision: WorkflowStepStatus;
  comments?: string;
  reason?: string;
}

export interface BulkApprovalRequest {
  approvalIds: number[];
  decision: WorkflowStepStatus;
  comments?: string;
  reason?: string;
}
