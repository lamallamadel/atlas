package com.example.backend.loader;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
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

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;

    public SeedDataLoader(AnnonceRepository annonceRepository,
                          DossierRepository dossierRepository,
                          PartiePrenanteRepository partiePrenanteRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
    }

    @Override
    public void run(String... args) {
        logger.info("Starting seed data loading for 'dev' profile...");

        if (annonceRepository.count() > 0) {
            logger.info("Database already contains data. Skipping seed data loading.");
            return;
        }

        loadAnnonces();
        loadDossiers();

        logger.info("Seed data loading completed successfully.");
    }

    private void loadAnnonces() {
        logger.info("Loading annonces...");

        Annonce annonce1 = new Annonce();
        annonce1.setOrgId("org-001");
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
        annonce1.setMeta(Map.of("source", "seed", "priority", "high"));
        annonce1.setCreatedBy("system-seed");
        annonce1.setUpdatedBy("system-seed");

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId("org-001");
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
        annonce2.setCreatedBy("system-seed");
        annonce2.setUpdatedBy("system-seed");

        Annonce annonce3 = new Annonce();
        annonce3.setOrgId("org-001");
        annonce3.setTitle("Commercial Space in Business District");
        annonce3.setDescription("Prime commercial location perfect for retail or office space.");
        annonce3.setCategory("Commercial");
        annonce3.setType(AnnonceType.LEASE);
        annonce3.setAddress("789 Business Boulevard");
        annonce3.setCity("Marseille");
        annonce3.setSurface(180.0);
        annonce3.setPrice(new BigDecimal("2800.00"));
        annonce3.setCurrency("EUR");
        annonce3.setStatus(AnnonceStatus.ARCHIVED);
        annonce3.setCreatedBy("system-seed");
        annonce3.setUpdatedBy("system-seed");

        Annonce annonce4 = new Annonce();
        annonce4.setOrgId("org-001");
        annonce4.setTitle("Modern Studio in Le Marais");
        annonce4.setDescription("Charming studio in the heart of Le Marais.");
        annonce4.setCategory("Residential");
        annonce4.setType(AnnonceType.RENT);
        annonce4.setAddress("10 Rue des Rosiers");
        annonce4.setCity("Paris");
        annonce4.setSurface(35.0);
        annonce4.setPrice(new BigDecimal("1200.00"));
        annonce4.setCurrency("EUR");
        annonce4.setStatus(AnnonceStatus.ACTIVE);
        annonce4.setMeta(Map.of("source", "seed-uat"));
        annonce4.setCreatedBy("system-seed");
        annonce4.setUpdatedBy("system-seed");

        // Duplicate case
        Annonce annonce5 = new Annonce();
        annonce5.setOrgId("org-001");
        annonce5.setTitle("Modern Studio in Le Marais");
        annonce5.setDescription("This is a duplicate for UAT testing.");
        annonce5.setCategory("Residential");
        annonce5.setType(AnnonceType.RENT);
        annonce5.setAddress("10 Rue des Rosiers");
        annonce5.setCity("Paris");
        annonce5.setSurface(35.0);
        annonce5.setPrice(new BigDecimal("1250.00"));
        annonce5.setCurrency("EUR");
        annonce5.setStatus(AnnonceStatus.DRAFT);
        annonce5.setMeta(Map.of("source", "seed-duplicate"));
        annonce5.setCreatedBy("system-seed");
        annonce5.setUpdatedBy("system-seed");

        List<Annonce> annonces = annonceRepository.saveAll(Arrays.asList(annonce1, annonce2, annonce3, annonce4, annonce5));
        logger.info("Loaded {} annonces", annonces.size());
    }

    private void loadDossiers() {
        logger.info("Loading dossiers...");

        List<Annonce> annonces = annonceRepository.findAll();
        Long annonceId = annonces.isEmpty() ? null : annonces.get(0).getId();

        List<Dossier> dossiers = new ArrayList<>();

        dossiers.add(createDossier("org-001", annonceId, "+33612345678", "Jean Dupont", "Website", DossierStatus.NEW, 85, DossierSource.WEB));
        dossiers.add(createDossier("org-001", annonceId, "+33698765432", "Marie Martin", "Mobile App", DossierStatus.NEW, 75, DossierSource.MOBILE));
        dossiers.add(createDossier("org-001", annonceId, "+33623456789", "Pierre Durand", "Phone Call", DossierStatus.NEW, 90, DossierSource.PHONE));
        dossiers.add(createDossier("org-001", annonceId, "+33645678901", "Sophie Bernard", "Email", DossierStatus.QUALIFIED, 88, DossierSource.EMAIL));
        dossiers.add(createDossier("org-001", annonceId, "+33656789012", "Luc Petit", "Referral", DossierStatus.QUALIFIED, 92, DossierSource.REFERRAL));
        dossiers.add(createDossier("org-001", annonceId, "+33667890123", "Emma Robert", "Walk-in", DossierStatus.QUALIFIED, 78, DossierSource.WALK_IN));
        dossiers.add(createDossier("org-001", annonceId, "+33678901234", "Thomas Richard", "Social Media", DossierStatus.APPOINTMENT, 95, DossierSource.SOCIAL_MEDIA));
        dossiers.add(createDossier("org-001", annonceId, "+33689012345", "Julie Dubois", "Website", DossierStatus.WON, 98, DossierSource.WEB));
        dossiers.add(createDossier("org-001", annonceId, "+33690123456", "Antoine Moreau", "Mobile App", DossierStatus.LOST, 65, DossierSource.MOBILE));
        dossiers.add(createDossier("org-001", annonceId, "+33612345678", "Jean Dupont", "Phone Call", DossierStatus.NEW, 80, DossierSource.PHONE));

        List<Dossier> savedDossiers = dossierRepository.saveAll(dossiers);
        logger.info("Loaded {} dossiers", savedDossiers.size());

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
        return dossier;
    }

    private void loadPartiesPrenantes(List<Dossier> dossiers) {
        logger.info("Loading parties prenantes...");

        if (dossiers.size() < 3) {
            logger.warn("Not enough dossiers to create parties prenantes");
            return;
        }

        List<PartiePrenanteEntity> parties = new ArrayList<>();

        PartiePrenanteEntity party1 = createPartie(dossiers.get(0), PartiePrenanteRole.BUYER, 
                "Jean", "Dupont", "jean.dupont@email.com", "+33612345678", "123 Rue de la Paix, Paris");
        parties.add(party1);

        PartiePrenanteEntity party2 = createPartie(dossiers.get(0), PartiePrenanteRole.AGENT,
                "Claude", "Leroy", "claude.leroy@agency.com", "+33601020304", "Agency Address, Paris");
        parties.add(party2);

        PartiePrenanteEntity party3 = createPartie(dossiers.get(1), PartiePrenanteRole.TENANT,
                "Marie", "Martin", "marie.martin@email.com", "+33698765432", "456 Avenue Victor Hugo, Lyon");
        parties.add(party3);

        PartiePrenanteEntity party4 = createPartie(dossiers.get(1), PartiePrenanteRole.LANDLORD,
                "François", "Girard", "francois.girard@email.com", "+33602030405", "789 Boulevard Haussmann, Paris");
        parties.add(party4);

        PartiePrenanteEntity party5 = createPartie(dossiers.get(2), PartiePrenanteRole.SELLER,
                "Pierre", "Durand", "pierre.durand@email.com", "+33623456789", "321 Rue du Commerce, Marseille");
        parties.add(party5);

        PartiePrenanteEntity party6 = createPartie(dossiers.get(2), PartiePrenanteRole.NOTARY,
                "Isabelle", "Laurent", "isabelle.laurent@notaire.fr", "+33603040506", "Notary Office, Marseille");
        parties.add(party6);

        List<PartiePrenanteEntity> savedParties = partiePrenanteRepository.saveAll(parties);
        logger.info("Loaded {} parties prenantes on 3 dossiers", savedParties.size());
        logger.info("Note: Duplicate phone entry exists - dossier #1 and #10 share phone +33612345678");
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
        partie.setMeta(Map.of("source", "seed"));
        return partie;
    }
}
