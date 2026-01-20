package com.example.backend.loader;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.ReferentialEntity;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import com.example.backend.repository.ReferentialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Profile("dev")
@Component
public class SeedDataLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SeedDataLoader.class);
    private static final String ORG_001 = "ORG-001";
    private static final String ORG_002 = "ORG-002";

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;
    private final ReferentialRepository referentialRepository;

    public SeedDataLoader(AnnonceRepository annonceRepository,
                          DossierRepository dossierRepository,
                          PartiePrenanteRepository partiePrenanteRepository,
                          ReferentialRepository referentialRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
        this.referentialRepository = referentialRepository;
    }

    @Override
    public void run(String... args) {
        logger.info("Starting seed data loading for 'dev' profile...");

        if (annonceRepository.count() > 0) {
            logger.info("Database already contains data. Skipping seed data loading.");
            return;
        }

        loadReferentials();
        loadAnnonces();
        loadDossiers();

        logger.info("Seed data loading completed successfully.");
    }

    private void loadReferentials() {
        logger.info("Loading referentials for ORG-001 and ORG-002...");
        
        List<ReferentialEntity> referentials = new ArrayList<>();
        
        for (String orgId : Arrays.asList(ORG_001, ORG_002)) {
            referentials.addAll(createReferentialsForOrg(orgId));
        }
        
        referentialRepository.saveAll(referentials);
        logger.info("Loaded {} referentials ({} per org)", referentials.size(), referentials.size() / 2);
    }

    private List<ReferentialEntity> createReferentialsForOrg(String orgId) {
        List<ReferentialEntity> referentials = new ArrayList<>();
        int order = 1;
        
        // CASE_TYPE
        referentials.add(createReferential(orgId, "CASE_TYPE", "CRM_LEAD_BUY", "Prospect Achat", "Lead for property purchase", order++, true));
        referentials.add(createReferential(orgId, "CASE_TYPE", "CRM_LEAD_RENT", "Prospect Location", "Lead for property rental", order++, true));
        referentials.add(createReferential(orgId, "CASE_TYPE", "CRM_OWNER_LEAD", "Prospect Propriétaire", "Owner lead (sell/rent)", order++, true));
        referentials.add(createReferential(orgId, "CASE_TYPE", "CRM_SALE_TRANSACTION", "Transaction Vente", "Sale transaction", order++, true));
        referentials.add(createReferential(orgId, "CASE_TYPE", "CRM_RENTAL_TRANSACTION", "Transaction Location", "Rental transaction", order++, true));
        
        order = 1;
        // CASE_STATUS
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_NEW", "Nouveau", "New case", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_TRIAGED", "Trié", "Triaged", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_CONTACTED", "Contacté", "Contacted", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_UNREACHABLE", "Injoignable", "Unreachable", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_QUALIFIED", "Qualifié", "Qualified", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_DISQUALIFIED", "Disqualifié", "Disqualified", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_ON_HOLD", "En attente", "On hold", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_VISIT_PLANNED", "Visite planifiée", "Visit planned", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_VISIT_DONE", "Visite effectuée", "Visit done", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_NO_SHOW", "Absent", "No show", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_FOLLOW_UP", "Relance", "Follow up", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_OFFER_REQUESTED", "Offre demandée", "Offer requested", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_OFFER_RECEIVED", "Offre reçue", "Offer received", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_NEGOTIATION", "Négociation", "Negotiation", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_SIGNING_SCHEDULED", "Signature planifiée", "Signing scheduled", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_CLOSED_WON", "Gagné", "Closed won", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "CRM_CLOSED_LOST", "Perdu", "Closed lost", order++, true));
        
        // Legacy status codes for backward compatibility
        referentials.add(createReferential(orgId, "CASE_STATUS", "NEW", "Nouveau (Legacy)", "Legacy NEW status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "QUALIFYING", "Qualification (Legacy)", "Legacy QUALIFYING status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "QUALIFIED", "Qualifié (Legacy)", "Legacy QUALIFIED status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "APPOINTMENT", "Rendez-vous (Legacy)", "Legacy APPOINTMENT status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "WON", "Gagné (Legacy)", "Legacy WON status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "LOST", "Perdu (Legacy)", "Legacy LOST status", order++, true));
        referentials.add(createReferential(orgId, "CASE_STATUS", "DRAFT", "Brouillon (Legacy)", "Legacy DRAFT status", order++, true));
        
        order = 1;
        // LEAD_SOURCE
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "WHATSAPP", "WhatsApp", "Lead from WhatsApp", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "PHONE_CALL", "Appel téléphonique", "Lead from phone call", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "SMS", "SMS", "Lead from SMS", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "EMAIL", "Email", "Lead from email", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "FACEBOOK", "Facebook", "Lead from Facebook", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "INSTAGRAM", "Instagram", "Lead from Instagram", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "AVITO", "Avito", "Lead from Avito", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "MUBAWAB", "Mubawab", "Lead from Mubawab", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "WEBSITE", "Site web", "Lead from website", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "WALK_IN", "Visite directe", "Walk-in lead", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "REFERRAL", "Recommandation", "Lead from referral", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "PARTNER", "Partenaire", "Lead from partner", order++, true));
        referentials.add(createReferential(orgId, "LEAD_SOURCE", "OTHER", "Autre", "Other lead source", order++, true));
        
        order = 1;
        // LOSS_REASON
        referentials.add(createReferential(orgId, "LOSS_REASON", "PRICE_TOO_HIGH", "Prix trop élevé", "Price too high", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "NOT_INTERESTED", "Pas intéressé", "Not interested", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "COMPETITOR", "Concurrence", "Competitor", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "NO_RESPONSE", "Sans réponse", "No response", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "FINANCING_ISSUE", "Problème de financement", "Financing issue", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "DOCS_INCOMPLETE", "Documents incomplets", "Documents incomplete", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "OWNER_CHANGED_MIND", "Propriétaire a changé d'avis", "Owner changed mind", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "PROPERTY_UNAVAILABLE", "Bien indisponible", "Property unavailable", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "REQUIREMENTS_MISMATCH", "Besoin non correspondant", "Requirements mismatch", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "TIMELINE_TOO_LONG", "Délai trop long", "Timeline too long", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "FRAUD_RISK", "Risque de fraude", "Fraud risk", order++, true));
        referentials.add(createReferential(orgId, "LOSS_REASON", "OTHER", "Autre", "Other reason", order++, true));
        
        order = 1;
        // WON_REASON
        referentials.add(createReferential(orgId, "WON_REASON", "SIGNED", "Signé", "Signed", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "RESERVED", "Réservé", "Reserved", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "DEPOSIT_PAID", "Acompte versé", "Deposit paid", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "SOLD", "Vendu", "Sold", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "RENTED", "Loué", "Rented", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "PROJECT_DELIVERED", "Projet livré", "Project delivered", order++, true));
        referentials.add(createReferential(orgId, "WON_REASON", "OTHER", "Autre", "Other reason", order++, true));
        
        return referentials;
    }

    private ReferentialEntity createReferential(String orgId, String category, String code, 
                                                 String label, String description, int order, boolean isSystem) {
        ReferentialEntity ref = new ReferentialEntity();
        ref.setOrgId(orgId);
        ref.setCategory(category);
        ref.setCode(code);
        ref.setLabel(label);
        ref.setDescription(description);
        ref.setDisplayOrder(order);
        ref.setIsActive(true);
        ref.setIsSystem(isSystem);
        ref.setCreatedBy("system-seed");
        ref.setUpdatedBy("system-seed");
        return ref;
    }

    private void loadAnnonces() {
        logger.info("Loading annonces for ORG-001 and ORG-002...");

        List<Annonce> annonces = new ArrayList<>();

        // ORG-001 Annonces (exactly 2 for predictable testing)
        Annonce annonce1 = new Annonce();
        annonce1.setOrgId(ORG_001);
        annonce1.setTitle("Beautiful 3BR Apartment in Downtown");
        annonce1.setDescription("Spacious apartment with modern amenities, great views, and convenient location.");
        annonce1.setCategory("Residential");
        annonce1.setType(AnnonceType.SALE);
        annonce1.setAddress("123 Main Street, Apt 5B");
        annonce1.setCity("Paris");
        annonce1.setSurface(120.5);
        annonce1.setPrice(new BigDecimal("450000.00"));
        annonce1.setCurrency("EUR");
        annonce1.setStatus(AnnonceStatus.ACTIVE);
        annonce1.setPhotos(Arrays.asList(
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        ));
        Map<String, Object> rules1 = new HashMap<>();
        rules1.put("petsAllowed", false);
        rules1.put("smokingAllowed", false);
        rules1.put("minLeaseTerm", 12);
        annonce1.setRulesJson(rules1);
        annonce1.setMeta(Map.of("source", "seed", "priority", "high", "org", ORG_001));
        annonce1.setCreatedBy("system-seed");
        annonce1.setUpdatedBy("system-seed");
        annonces.add(annonce1);

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId(ORG_001);
        annonce2.setTitle("Luxury Villa with Pool");
        annonce2.setDescription("Stunning villa with private pool, garden, and mountain views.");
        annonce2.setCategory("Residential");
        annonce2.setType(AnnonceType.RENT);
        annonce2.setAddress("456 Oak Avenue");
        annonce2.setCity("Lyon");
        annonce2.setSurface(250.0);
        annonce2.setPrice(new BigDecimal("3500.00"));
        annonce2.setCurrency("EUR");
        annonce2.setStatus(AnnonceStatus.PAUSED);
        annonce2.setMeta(Map.of("source", "seed", "org", ORG_001));
        annonce2.setCreatedBy("system-seed");
        annonce2.setUpdatedBy("system-seed");
        annonces.add(annonce2);

        // ORG-002 Annonces (exactly 2 for predictable testing)
        Annonce annonce3 = new Annonce();
        annonce3.setOrgId(ORG_002);
        annonce3.setTitle("Elegant 2BR Condo with Terrace");
        annonce3.setDescription("Bright and spacious condo with a large terrace overlooking the city.");
        annonce3.setCategory("Residential");
        annonce3.setType(AnnonceType.SALE);
        annonce3.setAddress("45 Avenue Montaigne");
        annonce3.setCity("Paris");
        annonce3.setSurface(95.0);
        annonce3.setPrice(new BigDecimal("650000.00"));
        annonce3.setCurrency("EUR");
        annonce3.setStatus(AnnonceStatus.ACTIVE);
        annonce3.setPhotos(Arrays.asList(
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
        ));
        annonce3.setMeta(Map.of("source", "seed", "priority", "medium", "org", ORG_002));
        annonce3.setCreatedBy("system-seed");
        annonce3.setUpdatedBy("system-seed");
        annonces.add(annonce3);

        Annonce annonce4 = new Annonce();
        annonce4.setOrgId(ORG_002);
        annonce4.setTitle("Cozy 1BR Apartment in Montmartre");
        annonce4.setDescription("Perfect starter home in the charming Montmartre district.");
        annonce4.setCategory("Residential");
        annonce4.setType(AnnonceType.RENT);
        annonce4.setAddress("22 Rue Lepic");
        annonce4.setCity("Paris");
        annonce4.setSurface(48.0);
        annonce4.setPrice(new BigDecimal("1350.00"));
        annonce4.setCurrency("EUR");
        annonce4.setStatus(AnnonceStatus.ACTIVE);
        annonce4.setMeta(Map.of("source", "seed", "org", ORG_002));
        annonce4.setCreatedBy("system-seed");
        annonce4.setUpdatedBy("system-seed");
        annonces.add(annonce4);

        List<Annonce> savedAnnonces = annonceRepository.saveAll(annonces);
        logger.info("Loaded {} annonces ({} for ORG-001, {} for ORG-002)", 
                savedAnnonces.size(), 2, 2);
    }

    private void loadDossiers() {
        logger.info("Loading dossiers for ORG-001 and ORG-002...");

        List<Annonce> allAnnonces = annonceRepository.findAll();
        
        List<Annonce> org001Annonces = allAnnonces.stream()
                .filter(a -> ORG_001.equals(a.getOrgId()))
                .toList();
        
        List<Annonce> org002Annonces = allAnnonces.stream()
                .filter(a -> ORG_002.equals(a.getOrgId()))
                .toList();

        List<Dossier> dossiers = new ArrayList<>();

        if (!org001Annonces.isEmpty()) {
            Long org001AnnonceId = org001Annonces.get(0).getId();
            
            // ORG-001 Dossiers
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33612345678", "Jean Dupont", "Website", DossierStatus.NEW, 85, DossierSource.WEB));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33698765432", "Marie Martin", "Mobile App", DossierStatus.NEW, 75, DossierSource.MOBILE));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33623456789", "Pierre Durand", "Phone Call", DossierStatus.NEW, 90, DossierSource.PHONE));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33645678901", "Sophie Bernard", "Email", DossierStatus.QUALIFIED, 88, DossierSource.EMAIL));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33656789012", "Luc Petit", "Referral", DossierStatus.QUALIFIED, 92, DossierSource.REFERRAL));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33667890123", "Emma Robert", "Walk-in", DossierStatus.QUALIFIED, 78, DossierSource.WALK_IN));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33678901234", "Thomas Richard", "Social Media", DossierStatus.APPOINTMENT, 95, DossierSource.SOCIAL_MEDIA));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33689012345", "Julie Dubois", "Website", DossierStatus.WON, 98, DossierSource.WEB));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33690123456", "Antoine Moreau", "Mobile App", DossierStatus.LOST, 65, DossierSource.MOBILE));
            dossiers.add(createDossier(ORG_001, org001AnnonceId, "+33612345678", "Jean Dupont", "Phone Call", DossierStatus.NEW, 80, DossierSource.PHONE));
        }

        if (!org002Annonces.isEmpty()) {
            Long org002AnnonceId = org002Annonces.get(0).getId();
            
            // ORG-002 Dossiers
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33711223344", "Alice Rousseau", "Website", DossierStatus.NEW, 82, DossierSource.WEB));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33722334455", "Bob Lefebvre", "Mobile App", DossierStatus.QUALIFIED, 87, DossierSource.MOBILE));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33733445566", "Catherine Blanc", "Email", DossierStatus.QUALIFIED, 91, DossierSource.EMAIL));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33744556677", "Daniel Leroy", "Referral", DossierStatus.APPOINTMENT, 94, DossierSource.REFERRAL));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33755667788", "Élise Bonnet", "Phone Call", DossierStatus.WON, 96, DossierSource.PHONE));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33766778899", "François Gauthier", "Walk-in", DossierStatus.NEW, 73, DossierSource.WALK_IN));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33777889900", "Gérard Fournier", "Social Media", DossierStatus.QUALIFIED, 85, DossierSource.SOCIAL_MEDIA));
            dossiers.add(createDossier(ORG_002, org002AnnonceId, "+33788990011", "Hélène Lambert", "Website", DossierStatus.LOST, 68, DossierSource.WEB));
        }

        List<Dossier> savedDossiers = dossierRepository.saveAll(dossiers);
        logger.info("Loaded {} dossiers ({} for ORG-001, {} for ORG-002)", 
                savedDossiers.size(), 10, 8);

        loadPartiesPrenantes(savedDossiers);
    }

    private Dossier createDossier(String orgId, Long annonceId, String leadPhone, String leadName, 
                                  String leadSource, DossierStatus status, Integer score, DossierSource source) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setAnnonceId(annonceId);
        dossier.setLeadPhone(leadPhone);
        dossier.setLeadName(leadName);
        dossier.setLeadSource(leadSource);
        dossier.setStatus(status);
        dossier.setScore(score);
        dossier.setSource(source);
        dossier.setCreatedBy("system-seed");
        dossier.setUpdatedBy("system-seed");
        
        // Set new referential fields
        dossier.setCaseType("CRM_LEAD_BUY");
        dossier.setStatusCode(status.name());
        
        if (status == DossierStatus.LOST) {
            dossier.setLossReason("NOT_INTERESTED");
        } else if (status == DossierStatus.WON) {
            dossier.setWonReason("SIGNED");
        }
        
        return dossier;
    }

    private void loadPartiesPrenantes(List<Dossier> dossiers) {
        logger.info("Loading parties prenantes...");

        if (dossiers.size() < 6) {
            logger.warn("Not enough dossiers to create parties prenantes");
            return;
        }

        List<PartiePrenanteEntity> parties = new ArrayList<>();

        // Get dossiers by org
        List<Dossier> org001Dossiers = dossiers.stream()
                .filter(d -> ORG_001.equals(d.getOrgId()))
                .toList();
        
        List<Dossier> org002Dossiers = dossiers.stream()
                .filter(d -> ORG_002.equals(d.getOrgId()))
                .toList();

        // ORG-001 Parties prenantes
        if (org001Dossiers.size() >= 3) {
            parties.add(createPartie(org001Dossiers.get(0), PartiePrenanteRole.BUYER, 
                    "Jean", "Dupont", "jean.dupont@email.com", "+33612345678", "123 Rue de la Paix, Paris"));
            
            parties.add(createPartie(org001Dossiers.get(0), PartiePrenanteRole.AGENT,
                    "Claude", "Leroy", "claude.leroy@agency.com", "+33601020304", "Agency Address, Paris"));
            
            parties.add(createPartie(org001Dossiers.get(1), PartiePrenanteRole.TENANT,
                    "Marie", "Martin", "marie.martin@email.com", "+33698765432", "456 Avenue Victor Hugo, Lyon"));
            
            parties.add(createPartie(org001Dossiers.get(1), PartiePrenanteRole.LANDLORD,
                    "François", "Girard", "francois.girard@email.com", "+33602030405", "789 Boulevard Haussmann, Paris"));
            
            parties.add(createPartie(org001Dossiers.get(2), PartiePrenanteRole.SELLER,
                    "Pierre", "Durand", "pierre.durand@email.com", "+33623456789", "321 Rue du Commerce, Marseille"));
            
            parties.add(createPartie(org001Dossiers.get(2), PartiePrenanteRole.NOTARY,
                    "Isabelle", "Laurent", "isabelle.laurent@notaire.fr", "+33603040506", "Notary Office, Marseille"));
        }

        // ORG-002 Parties prenantes
        if (org002Dossiers.size() >= 3) {
            parties.add(createPartie(org002Dossiers.get(0), PartiePrenanteRole.BUYER,
                    "Alice", "Rousseau", "alice.rousseau@email.com", "+33711223344", "22 Rue de Rivoli, Paris"));
            
            parties.add(createPartie(org002Dossiers.get(0), PartiePrenanteRole.AGENT,
                    "Marc", "Dubois", "marc.dubois@realestate.com", "+33701112233", "Real Estate Office, Paris"));
            
            parties.add(createPartie(org002Dossiers.get(1), PartiePrenanteRole.TENANT,
                    "Bob", "Lefebvre", "bob.lefebvre@email.com", "+33722334455", "88 Avenue des Champs, Lyon"));
            
            parties.add(createPartie(org002Dossiers.get(2), PartiePrenanteRole.LANDLORD,
                    "Catherine", "Blanc", "catherine.blanc@email.com", "+33733445566", "45 Rue de la République, Marseille"));
        }

        List<PartiePrenanteEntity> savedParties = partiePrenanteRepository.saveAll(parties);
        logger.info("Loaded {} parties prenantes ({} for ORG-001, {} for ORG-002)",
                savedParties.size(), 6, 4);
        logger.info("Note: Duplicate phone entry exists - dossier #1 and #10 share phone +33612345678 (ORG-001)");
    }

    private PartiePrenanteEntity createPartie(Dossier dossier, PartiePrenanteRole role,
                                              String firstName, String lastName, String email,
                                              String phone, String address) {
        PartiePrenanteEntity partie = new PartiePrenanteEntity();
        partie.setOrgId(dossier.getOrgId());
        partie.setDossier(dossier);
        partie.setRole(role);
        partie.setFirstName(firstName);
        partie.setLastName(lastName);
        partie.setEmail(email);
        partie.setPhone(phone);
        partie.setAddress(address);
        partie.setMeta(Map.of("source", "seed", "org", dossier.getOrgId()));
        return partie;
    }
}
