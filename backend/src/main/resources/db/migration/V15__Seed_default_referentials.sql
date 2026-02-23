-- Seed default referentials for DEFAULT-ORG
-- This provides a baseline set of referentials for new tenants
-- Note: SeedDataLoader handles seeding for dev profile
-- Production tenants should create their own referentials via application logic

-- CASE_TYPE referentials
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'CASE_TYPE', 'CRM_LEAD_BUY', 'Prospect Achat', 'Lead for property purchase', 1, true, true),
('DEFAULT-ORG', 'CASE_TYPE', 'CRM_LEAD_RENT', 'Prospect Location', 'Lead for property rental', 2, true, true),
('DEFAULT-ORG', 'CASE_TYPE', 'CRM_OWNER_LEAD', 'Prospect Propriétaire', 'Owner lead (sell/rent)', 3, true, true),
('DEFAULT-ORG', 'CASE_TYPE', 'CRM_SALE_TRANSACTION', 'Transaction Vente', 'Sale transaction', 4, true, true),
('DEFAULT-ORG', 'CASE_TYPE', 'CRM_RENTAL_TRANSACTION', 'Transaction Location', 'Rental transaction', 5, true, true);

-- CASE_STATUS referentials
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_NEW', 'Nouveau', 'New case', 1, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_TRIAGED', 'Trié', 'Triaged', 2, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_CONTACTED', 'Contacté', 'Contacted', 3, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_UNREACHABLE', 'Injoignable', 'Unreachable', 4, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_QUALIFIED', 'Qualifié', 'Qualified', 5, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_DISQUALIFIED', 'Disqualifié', 'Disqualified', 6, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_ON_HOLD', 'En attente', 'On hold', 7, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_VISIT_PLANNED', 'Visite planifiée', 'Visit planned', 8, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_VISIT_DONE', 'Visite effectuée', 'Visit done', 9, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_NO_SHOW', 'Absent', 'No show', 10, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_FOLLOW_UP', 'Relance', 'Follow up', 11, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_OFFER_REQUESTED', 'Offre demandée', 'Offer requested', 12, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_OFFER_RECEIVED', 'Offre reçue', 'Offer received', 13, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_NEGOTIATION', 'Négociation', 'Negotiation', 14, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_SIGNING_SCHEDULED', 'Signature planifiée', 'Signing scheduled', 15, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_CLOSED_WON', 'Gagné', 'Closed won', 16, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'CRM_CLOSED_LOST', 'Perdu', 'Closed lost', 17, true, true);

-- Legacy CASE_STATUS codes for backward compatibility
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'CASE_STATUS', 'NEW', 'Nouveau (Legacy)', 'Legacy NEW status', 18, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'QUALIFYING', 'Qualification (Legacy)', 'Legacy QUALIFYING status', 19, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'QUALIFIED', 'Qualifié (Legacy)', 'Legacy QUALIFIED status', 20, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'APPOINTMENT', 'Rendez-vous (Legacy)', 'Legacy APPOINTMENT status', 21, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'WON', 'Gagné (Legacy)', 'Legacy WON status', 22, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'LOST', 'Perdu (Legacy)', 'Legacy LOST status', 23, true, true),
('DEFAULT-ORG', 'CASE_STATUS', 'DRAFT', 'Brouillon (Legacy)', 'Legacy DRAFT status', 24, true, true);

-- LEAD_SOURCE referentials
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'LEAD_SOURCE', 'WHATSAPP', 'WhatsApp', 'Lead from WhatsApp', 1, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'PHONE_CALL', 'Appel téléphonique', 'Lead from phone call', 2, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'SMS', 'SMS', 'Lead from SMS', 3, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'EMAIL', 'Email', 'Lead from email', 4, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'FACEBOOK', 'Facebook', 'Lead from Facebook', 5, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'INSTAGRAM', 'Instagram', 'Lead from Instagram', 6, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'AVITO', 'Avito', 'Lead from Avito', 7, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'MUBAWAB', 'Mubawab', 'Lead from Mubawab', 8, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'WEBSITE', 'Site web', 'Lead from website', 9, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'WALK_IN', 'Visite directe', 'Walk-in lead', 10, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'REFERRAL', 'Recommandation', 'Lead from referral', 11, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'PARTNER', 'Partenaire', 'Lead from partner', 12, true, true),
('DEFAULT-ORG', 'LEAD_SOURCE', 'OTHER', 'Autre', 'Other lead source', 13, true, true);

-- LOSS_REASON referentials
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'LOSS_REASON', 'PRICE_TOO_HIGH', 'Prix trop élevé', 'Price too high', 1, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'NOT_INTERESTED', 'Pas intéressé', 'Not interested', 2, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'COMPETITOR', 'Concurrence', 'Competitor', 3, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'NO_RESPONSE', 'Sans réponse', 'No response', 4, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'FINANCING_ISSUE', 'Problème de financement', 'Financing issue', 5, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'DOCS_INCOMPLETE', 'Documents incomplets', 'Documents incomplete', 6, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'OWNER_CHANGED_MIND', 'Propriétaire a changé d''avis', 'Owner changed mind', 7, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'PROPERTY_UNAVAILABLE', 'Bien indisponible', 'Property unavailable', 8, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'REQUIREMENTS_MISMATCH', 'Besoin non correspondant', 'Requirements mismatch', 9, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'TIMELINE_TOO_LONG', 'Délai trop long', 'Timeline too long', 10, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'FRAUD_RISK', 'Risque de fraude', 'Fraud risk', 11, true, true),
('DEFAULT-ORG', 'LOSS_REASON', 'OTHER', 'Autre', 'Other reason', 12, true, true);

-- WON_REASON referentials
INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
('DEFAULT-ORG', 'WON_REASON', 'SIGNED', 'Signé', 'Signed', 1, true, true),
('DEFAULT-ORG', 'WON_REASON', 'RESERVED', 'Réservé', 'Reserved', 2, true, true),
('DEFAULT-ORG', 'WON_REASON', 'DEPOSIT_PAID', 'Acompte versé', 'Deposit paid', 3, true, true),
('DEFAULT-ORG', 'WON_REASON', 'SOLD', 'Vendu', 'Sold', 4, true, true),
('DEFAULT-ORG', 'WON_REASON', 'RENTED', 'Loué', 'Rented', 5, true, true),
('DEFAULT-ORG', 'WON_REASON', 'PROJECT_DELIVERED', 'Projet livré', 'Project delivered', 6, true, true),
('DEFAULT-ORG', 'WON_REASON', 'OTHER', 'Autre', 'Other reason', 7, true, true);


