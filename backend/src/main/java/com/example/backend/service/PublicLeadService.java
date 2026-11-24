package com.example.backend.service;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Demandes publiques (portail et vitrine) transformées en dossiers dans la bonne agence.
 *
 * <ul>
 *   <li>Depuis une fiche annonce : le dossier va à l'agence <b>propriétaire de l'annonce</b>, avec
 *       un type déduit de l'annonce (achat ou location).
 *   <li>Depuis la vitrine (sans annonce) : le dossier va à l'organisation de la plateforme ({@code
 *       atlas.portal.platform-org-id}), en {@code CRM_LEAD_B2B_DEMO} pour une démo.
 * </ul>
 *
 * <p>La case « être recontacté » est obligatoire ; elle est enregistrée comme accord {@code
 * TRANSACTIONNEL} (suivi de la demande) sur le téléphone, WhatsApp et l'e-mail fournis, avec sa
 * preuve. Ce n'est pas un accord de prospection ({@code MARKETING}).
 */
@Service
public class PublicLeadService {

    private static final Logger log = LoggerFactory.getLogger(PublicLeadService.class);

    public static final String CONSENT_TEXT_VERSION = "PUBLIC_CONTACT_V1";
    public static final String CONSENT_TEXT =
            "J'accepte d'être recontacté(e) au sujet de ma demande, par téléphone, WhatsApp"
                    + " ou e-mail.";

    static final String SOURCE_PORTAIL = "PORTAIL";
    static final String SOURCE_VITRINE = "VITRINE";

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final DossierService dossierService;
    private final ConsentementService consentementService;
    private final String platformOrgId;

    public PublicLeadService(
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            DossierService dossierService,
            ConsentementService consentementService,
            @Value("${atlas.portal.platform-org-id:ORG-001}") String platformOrgId) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.dossierService = dossierService;
        this.consentementService = consentementService;
        this.platformOrgId = platformOrgId;
    }

    /** Règle d'exposition publique d'une annonce (étape 4 du backlog : à unifier). */
    public static boolean isPubliclyVisible(Annonce annonce) {
        return annonce != null && annonce.getStatus() == AnnonceStatus.PUBLISHED;
    }

    /** Annonce visible publiquement, toutes agences confondues. */
    @Transactional(readOnly = true)
    public Optional<Annonce> findPublicAnnonce(Long id) {
        return annonceRepository.findById(id).filter(PublicLeadService::isPubliclyVisible);
    }

    @Transactional
    public void submit(PortalLeadRequest request, String ipAddress, String userAgent) {
        if (!Boolean.TRUE.equals(request.getConsent())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CONSENT_REQUIRED: cochez la case pour accepter d'être recontacté(e).");
        }
        String phone = blankToNull(request.getPhone());
        String email = blankToNull(request.getEmail());
        if (phone == null && email == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CONTACT_REQUIRED: indiquez un téléphone ou une adresse e-mail.");
        }

        String requestType = normalizeType(request.getRequestType());
        String orgId;
        String caseType;
        String source;
        Long annonceId = null;

        if (request.getAnnonceId() != null) {
            Annonce annonce =
                    findPublicAnnonce(request.getAnnonceId())
                            .orElseThrow(
                                    () ->
                                            new ResponseStatusException(
                                                    HttpStatus.NOT_FOUND,
                                                    "ANNONCE_NOT_FOUND: cette annonce n'est plus"
                                                            + " disponible."));
            orgId = annonce.getOrgId();
            caseType = caseTypeFor(annonce.getType());
            source = SOURCE_PORTAIL;
            annonceId = annonce.getId();
        } else {
            orgId = platformOrgId;
            caseType = "DEMO".equals(requestType) ? "CRM_LEAD_B2B_DEMO" : "CRM_LEAD";
            source = SOURCE_VITRINE;
        }

        String previousOrg = TenantContext.getOrgId();
        TenantContext.setOrgId(orgId);
        try {
            DossierCreateRequest dossier = new DossierCreateRequest();
            dossier.setAnnonceId(annonceId);
            dossier.setLeadName(request.getName().trim());
            dossier.setLeadPhone(phone);
            dossier.setLeadSource(source);
            dossier.setSource(DossierSource.WEB);
            dossier.setCaseType(caseType);
            dossier.setNotes(buildNotes(requestType, email, request.getMessage()));

            DossierResponse created = dossierService.create(dossier);
            java.util.Map<String, Object> details =
                    annonceId == null && request.getDemo() != null
                            ? request.getDemo().toMap()
                            : java.util.Map.of();
            if (email != null || !details.isEmpty()) {
                dossierRepository
                        .findById(created.getId())
                        .ifPresent(
                                d -> {
                                    if (email != null) {
                                        d.setLeadEmail(email);
                                    }
                                    if (!details.isEmpty()) {
                                        d.setLeadDetails(new java.util.HashMap<>(details));
                                    }
                                    dossierRepository.save(d);
                                });
            }
            recordContactConsent(created.getId(), phone, email, source, ipAddress, userAgent);
            log.info(
                    "Public lead received: dossierId={}, orgId={}, caseType={}, source={}",
                    created.getId(),
                    orgId,
                    caseType,
                    source);
        } finally {
            if (previousOrg != null) {
                TenantContext.setOrgId(previousOrg);
            } else {
                TenantContext.clear();
            }
        }
    }

    private void recordContactConsent(
            Long dossierId,
            String phone,
            String email,
            String source,
            String ipAddress,
            String userAgent) {
        List<ConsentementChannel> channels = new ArrayList<>();
        if (phone != null) {
            channels.add(ConsentementChannel.PHONE);
            channels.add(ConsentementChannel.WHATSAPP);
        }
        if (email != null) {
            channels.add(ConsentementChannel.EMAIL);
        }
        String now = LocalDateTime.now().toString();
        for (ConsentementChannel channel : channels) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("source", source + "_FORM");
            meta.put("consentTextVersion", CONSENT_TEXT_VERSION);
            meta.put("consentText", CONSENT_TEXT);
            meta.put("ipAddress", ipAddress);
            meta.put("userAgent", userAgent);
            meta.put("grantedAt", now);

            ConsentementCreateRequest consent = new ConsentementCreateRequest();
            consent.setDossierId(dossierId);
            consent.setChannel(channel);
            consent.setConsentType(ConsentementType.TRANSACTIONNEL);
            consent.setStatus(ConsentementStatus.GRANTED);
            consent.setMeta(meta);
            consentementService.create(consent);
        }
    }

    static String caseTypeFor(AnnonceType type) {
        if (type == null) {
            return "CRM_LEAD";
        }
        return switch (type) {
            case SALE -> "CRM_LEAD_BUY";
            case RENT, RENTAL, LEASE -> "CRM_LEAD_RENT";
            default -> "CRM_LEAD";
        };
    }

    private static String normalizeType(String type) {
        return type == null ? "INFO" : type.trim().toUpperCase();
    }

    private static String buildNotes(String requestType, String email, String message) {
        String label =
                switch (requestType) {
                    case "VISIT" -> "Demande de visite";
                    case "DEMO" -> "Demande de démo";
                    case "CONTACT" -> "Message depuis le site";
                    default -> "Demande d'information";
                };
        StringBuilder sb = new StringBuilder("[").append(label).append("]");
        if (email != null) {
            sb.append("\nE-mail : ").append(email);
        }
        if (message != null && !message.isBlank()) {
            sb.append("\n").append(message.trim());
        }
        return sb.toString();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
