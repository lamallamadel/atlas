-- V902__seed_vitrine_leads.sql
-- Seed data for Vitrine/Portail Mocks (Leads & Contacts)

-- 1. Seed B2B Demo Request Lead (Vitrine)
INSERT INTO dossier (
    org_id, lead_name, lead_email, lead_phone, lead_source, notes, status, case_type, status_code, created_at, updated_at, created_by, updated_by
) VALUES 
('default', 'Sarah B2B (Demo Demand)', 'sarah.b2b@promo-real.com', '+212600112233', 'VITRINE_DEMO', 'Demande de démo pour le plan Enterprise. Agence de 50 collaborateurs, volume important.', 'NEW', 'CRM_LEAD_B2B', 'CRM_NEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- 2. Seed B2B Contact Request (Vitrine)
INSERT INTO dossier (
    org_id, lead_name, lead_email, lead_phone, lead_source, notes, status, case_type, status_code, created_at, updated_at, created_by, updated_by
) VALUES 
('default', 'Mohamed Agence', 'mohamed@agence-atlas.ma', '+212644556677', 'VITRINE_CONTACT', 'Sujet: Question sur la facturation. Message: Bonjour, est-ce que le module WhatsApp est inclus ?', 'QUALIFYING', 'CRM_LEAD_B2B', 'CRM_TRIAGED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- 3. Seed B2C Lead from Portail (Interest on Annonce 1 - Villa)
INSERT INTO dossier (
    org_id, annonce_id, lead_name, lead_email, lead_phone, lead_source, notes, status, case_type, status_code, created_at, updated_at, created_by, updated_by
) VALUES 
('default', 1, 'Amine Acheteur', 'amine.acht@gmail.com', '+212611223344', 'PORTAIL', 'A vu la villa moderne sur le portail et souhaite programmer une visite ce weekend.', 'APPOINTMENT', 'CRM_LEAD_BUY', 'CRM_VISIT_SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- 4. Seed B2C Lead from Portail (Interest on Annonce 4 - Location Tanger)
INSERT INTO dossier (
    org_id, annonce_id, lead_name, lead_email, lead_phone, lead_source, notes, status, case_type, status_code, created_at, updated_at, created_by, updated_by
) VALUES 
('default', 4, 'Youssef Locataire', 'youssef.loc@hotmail.com', '+212699887766', 'PORTAIL', 'Demande via formulaire portail. Cherche location longue durée immédiate.', 'NEW', 'CRM_LEAD_RENT', 'CRM_NEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Insert detailed parties prenantes for these dossiers to enrich CRM view
-- Note: Replaced PROSPECT_B2B by AGENT to fit existing Enums
INSERT INTO partie_prenante (
    org_id, dossier_id, role, name, first_name, last_name, email, phone, created_at, updated_at, created_by, updated_by
) VALUES 
('default', (SELECT MAX(id)-3 FROM dossier), 'AGENT', 'Sarah B2B', 'Sarah', 'B2B', 'sarah.b2b@promo-real.com', '+212600112233', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('default', (SELECT MAX(id)-2 FROM dossier), 'AGENT', 'Mohamed Agence', 'Mohamed', 'Agence', 'mohamed@agence-atlas.ma', '+212644556677', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('default', (SELECT MAX(id)-1 FROM dossier), 'BUYER', 'Amine Acheteur', 'Amine', 'Acheteur', 'amine.acht@gmail.com', '+212611223344', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('default', (SELECT MAX(id) FROM dossier), 'TENANT', 'Youssef Locataire', 'Youssef', 'Locataire', 'youssef.loc@hotmail.com', '+212699887766', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');
