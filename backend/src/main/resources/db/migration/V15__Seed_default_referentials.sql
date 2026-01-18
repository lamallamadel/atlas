-- Seed default referentials for each existing tenant
-- This will be executed for all existing org_ids in the database

-- Function to seed referentials for a given org_id
DO $$
DECLARE
    org_record RECORD;
    order_counter INTEGER;
BEGIN
    -- Loop through all distinct org_ids
    FOR org_record IN SELECT DISTINCT org_id FROM dossier
    LOOP
        order_counter := 1;
        
        -- CASE_TYPE referentials
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_TYPE', 'CRM_LEAD_BUY', 'Prospect Achat', 'Lead for property purchase', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_TYPE', 'CRM_LEAD_RENT', 'Prospect Location', 'Lead for property rental', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_TYPE', 'CRM_OWNER_LEAD', 'Prospect Propriétaire', 'Owner lead (sell/rent)', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_TYPE', 'CRM_SALE_TRANSACTION', 'Transaction Vente', 'Sale transaction', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_TYPE', 'CRM_RENTAL_TRANSACTION', 'Transaction Location', 'Rental transaction', order_counter, true, true);
        order_counter := order_counter + 1;
        
        -- CASE_STATUS referentials
        order_counter := 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_NEW', 'Nouveau', 'New case', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_TRIAGED', 'Trié', 'Triaged', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_CONTACTED', 'Contacté', 'Contacted', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_UNREACHABLE', 'Injoignable', 'Unreachable', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_QUALIFIED', 'Qualifié', 'Qualified', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_DISQUALIFIED', 'Disqualifié', 'Disqualified', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_ON_HOLD', 'En attente', 'On hold', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_VISIT_PLANNED', 'Visite planifiée', 'Visit planned', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_VISIT_DONE', 'Visite effectuée', 'Visit done', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_NO_SHOW', 'Absent', 'No show', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_FOLLOW_UP', 'Relance', 'Follow up', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_OFFER_REQUESTED', 'Offre demandée', 'Offer requested', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_OFFER_RECEIVED', 'Offre reçue', 'Offer received', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_NEGOTIATION', 'Négociation', 'Negotiation', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_SIGNING_SCHEDULED', 'Signature planifiée', 'Signing scheduled', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_CLOSED_WON', 'Gagné', 'Closed won', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'CRM_CLOSED_LOST', 'Perdu', 'Closed lost', order_counter, true, true);
        order_counter := order_counter + 1;
        
        -- Map old enum status values to new codes for backward compatibility
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'NEW', 'Nouveau (Legacy)', 'Legacy NEW status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'QUALIFYING', 'Qualification (Legacy)', 'Legacy QUALIFYING status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'QUALIFIED', 'Qualifié (Legacy)', 'Legacy QUALIFIED status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'APPOINTMENT', 'Rendez-vous (Legacy)', 'Legacy APPOINTMENT status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'WON', 'Gagné (Legacy)', 'Legacy WON status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'LOST', 'Perdu (Legacy)', 'Legacy LOST status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'CASE_STATUS', 'DRAFT', 'Brouillon (Legacy)', 'Legacy DRAFT status', order_counter, true, true);
        order_counter := order_counter + 1;
        
        -- LEAD_SOURCE referentials
        order_counter := 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'WHATSAPP', 'WhatsApp', 'Lead from WhatsApp', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'PHONE_CALL', 'Appel téléphonique', 'Lead from phone call', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'SMS', 'SMS', 'Lead from SMS', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'EMAIL', 'Email', 'Lead from email', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'FACEBOOK', 'Facebook', 'Lead from Facebook', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'INSTAGRAM', 'Instagram', 'Lead from Instagram', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'AVITO', 'Avito', 'Lead from Avito', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'MUBAWAB', 'Mubawab', 'Lead from Mubawab', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'WEBSITE', 'Site web', 'Lead from website', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'WALK_IN', 'Visite directe', 'Walk-in lead', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'REFERRAL', 'Recommandation', 'Lead from referral', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'PARTNER', 'Partenaire', 'Lead from partner', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LEAD_SOURCE', 'OTHER', 'Autre', 'Other lead source', order_counter, true, true);
        order_counter := order_counter + 1;
        
        -- LOSS_REASON referentials
        order_counter := 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'PRICE_TOO_HIGH', 'Prix trop élevé', 'Price too high', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'NOT_INTERESTED', 'Pas intéressé', 'Not interested', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'COMPETITOR', 'Concurrence', 'Competitor', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'NO_RESPONSE', 'Sans réponse', 'No response', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'FINANCING_ISSUE', 'Problème de financement', 'Financing issue', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'DOCS_INCOMPLETE', 'Documents incomplets', 'Documents incomplete', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'OWNER_CHANGED_MIND', 'Propriétaire a changé d''avis', 'Owner changed mind', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'PROPERTY_UNAVAILABLE', 'Bien indisponible', 'Property unavailable', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'REQUIREMENTS_MISMATCH', 'Besoin non correspondant', 'Requirements mismatch', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'TIMELINE_TOO_LONG', 'Délai trop long', 'Timeline too long', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'FRAUD_RISK', 'Risque de fraude', 'Fraud risk', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'LOSS_REASON', 'OTHER', 'Autre', 'Other reason', order_counter, true, true);
        order_counter := order_counter + 1;
        
        -- WON_REASON referentials
        order_counter := 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'SIGNED', 'Signé', 'Signed', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'RESERVED', 'Réservé', 'Reserved', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'DEPOSIT_PAID', 'Acompte versé', 'Deposit paid', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'SOLD', 'Vendu', 'Sold', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'RENTED', 'Loué', 'Rented', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'PROJECT_DELIVERED', 'Projet livré', 'Project delivered', order_counter, true, true);
        order_counter := order_counter + 1;
        
        INSERT INTO referential (org_id, category, code, label, description, display_order, is_active, is_system) VALUES
        (org_record.org_id, 'WON_REASON', 'OTHER', 'Autre', 'Other reason', order_counter, true, true);
        
    END LOOP;
END $$;
