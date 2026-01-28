export enum SignatureStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  EXPIRED = 'EXPIRED'
}

export interface SignerInfo {
  name: string;
  email: string;
  routingOrder?: number;
  roleName?: string;
}

export interface SignatureRequest {
  id?: number;
  dossierId: number;
  templateId?: number;
  envelopeId?: string;
  status: SignatureStatus;
  signers: SignerInfo[];
  subject: string;
  emailMessage?: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  completedAt?: string;
  declinedAt?: string;
  voidedAt?: string;
  declinedReason?: string;
  voidedReason?: string;
  signedDocumentId?: number;
  certificatePath?: string;
  auditTrail?: any;
  workflowTriggered?: boolean;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface SignatureRequestCreate {
  dossierId: number;
  templateId?: number;
  signers: SignerInfo[];
  subject: string;
  emailMessage?: string;
  expirationDays?: number;
}

export interface ContractTemplate {
  id?: number;
  templateName: string;
  templateType: string;
  fileName?: string;
  storagePath?: string;
  fileSize?: number;
  description?: string;
  signatureFields?: any;
  isActive?: boolean;
  docusignTemplateId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ContractTemplateCreate {
  templateName: string;
  templateType: string;
  description?: string;
  signatureFields?: any;
  isActive?: boolean;
}
