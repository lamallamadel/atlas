export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE'
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
  TRANSACTIONAL = 'TRANSACTIONAL'
}

export enum ComponentType {
  HEADER = 'HEADER',
  BODY = 'BODY',
  FOOTER = 'FOOTER',
  BUTTONS = 'BUTTONS'
}

export enum ButtonType {
  QUICK_REPLY = 'QUICK_REPLY',
  CALL_TO_ACTION = 'CALL_TO_ACTION',
  URL = 'URL',
  PHONE_NUMBER = 'PHONE_NUMBER'
}

export interface TemplateVariable {
  id?: number;
  variableName: string;
  componentType: ComponentType;
  position: number;
  exampleValue?: string;
  description?: string;
  isRequired: boolean;
}

export interface TemplateComponent {
  type: ComponentType;
  text?: string;
  format?: string;
  example?: { [key: string]: string[] };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface WhatsAppTemplate {
  id?: number;
  orgId?: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  whatsAppTemplateId?: string;
  components: TemplateComponent[];
  variables: TemplateVariable[];
  description?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TemplateApprovalRequest {
  whatsAppTemplateId: string;
}

export interface TemplateRejectionRequest {
  rejectionReason: string;
}

export interface TemplateSubmissionResult {
  success: boolean;
  templateId?: string;
  message: string;
}

export interface VariablePlaceholder {
  name: string;
  position: number;
  componentType: ComponentType;
  displayText: string;
}
