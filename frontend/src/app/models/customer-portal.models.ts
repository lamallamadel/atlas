export interface CustomerPortalDossier {
  id: number;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  statusDisplay: string;
  progressPercentage: string;
  createdAt: string;
  updatedAt: string;
  activities: CustomerPortalActivity[];
  documents: CustomerPortalDocument[];
  unreadMessagesCount: number;
}

export interface CustomerPortalActivity {
  id: number;
  type: string;
  content: string;
  friendlyDescription: string;
  createdAt: string;
  metadata: any;
}

export interface CustomerPortalDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  categoryDisplay: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface ClientSecureMessage {
  id?: number;
  orgId: string;
  dossierId: number;
  fromClient: boolean;
  encryptedContent: string;
  initializationVector: string;
  senderId: string;
  readAt?: string;
  createdAt?: string;
}

export interface ClientAppointmentRequest {
  id?: number;
  orgId: string;
  dossierId: number;
  proposedStartTime: string;
  proposedEndTime: string;
  preferredLocation?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  agentResponse?: string;
  appointmentId?: number;
  respondedAt?: string;
  respondedBy?: string;
  createdAt?: string;
}

export interface ClientSatisfactionSurvey {
  id?: number;
  orgId: string;
  dossierId: number;
  triggerType?: string;
  triggerEntityId?: number;
  overallRating?: number;
  communicationRating?: number;
  responsivenessRating?: number;
  professionalismRating?: number;
  comments?: string;
  additionalData?: any;
  completedAt?: string;
  createdAt?: string;
}

export interface ConsentPreference {
  id: number;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PHONE';
  consentType: string;
  status: 'GRANTED' | 'DENIED' | 'PENDING';
}

export interface WhiteLabelBranding {
  logoUrl?: string;
  logoUrlDark?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
}

export interface PropertyRecommendation {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrl?: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
}
