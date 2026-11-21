package com.example.backend.service;

import com.example.backend.dto.ConsentLinkResponse;
import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementResponse;
import com.example.backend.dto.PublicConsentView;
import com.example.backend.entity.ConsentRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.repository.ConsentRequestRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Double opt-in : l'agent génère un lien, le client confirme (ou refuse) lui-même sur une page
 * publique. La confirmation enregistre un consentement avec la preuve exigée pour la prospection
 * (horodatage, adresse IP, double opt-in confirmé).
 */
@Service
public class ConsentRequestService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ANSWERED = "ANSWERED";
    public static final String STATUS_EXPIRED = "EXPIRED";
    public static final String ACCEPT = "ACCEPT";
    public static final String REFUSE = "REFUSE";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConsentRequestRepository requestRepository;
    private final DossierRepository dossierRepository;
    private final ConsentementService consentementService;
    private final String publicBaseUrl;
    private final int validityDays;

    public ConsentRequestService(
            ConsentRequestRepository requestRepository,
            DossierRepository dossierRepository,
            ConsentementService consentementService,
            @Value(
                            "${atlas.consent.public-base-url:${customer-portal.base-url:http://localhost:4200}}")
                    String publicBaseUrl,
            @Value("${atlas.consent.link-validity-days:7}") int validityDays) {
        this.requestRepository = requestRepository;
        this.dossierRepository = dossierRepository;
        this.consentementService = consentementService;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
        this.validityDays = validityDays;
    }

    /** Crée un lien à usage unique pour le dossier (organisation courante). */
    @Transactional
    public ConsentLinkResponse createLink(
            Long dossierId, ConsentementChannel channel, ConsentementType consentType) {
        String orgId = TenantContext.getOrgId();
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .filter(d -> orgId != null && orgId.equals(d.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Dossier introuvable."));

        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        LocalDateTime now = LocalDateTime.now();

        ConsentRequest r = new ConsentRequest();
        r.setOrgId(dossier.getOrgId());
        r.setDossierId(dossier.getId());
        r.setChannel(channel != null ? channel : ConsentementChannel.WHATSAPP);
        r.setConsentType(consentType != null ? consentType : ConsentementType.MARKETING);
        r.setTokenHash(hash(token));
        r.setExpiresAt(now.plusDays(validityDays));
        r.setCreatedAt(now);
        r.setCreatedBy(currentUser());
        ConsentRequest saved = requestRepository.save(r);

        return new ConsentLinkResponse(
                saved.getId(),
                publicBaseUrl + "/consentement/" + token,
                saved.getChannel().name(),
                saved.getConsentType().name(),
                saved.getExpiresAt());
    }

    /** Page publique : état du lien, sans données personnelles au-delà du prénom. */
    @Transactional(readOnly = true)
    public PublicConsentView view(String token) {
        ConsentRequest r = find(token);
        Dossier dossier = dossierRepository.findById(r.getDossierId()).orElse(null);
        return toView(r, dossier);
    }

    /** Réponse du client. Une seule réponse par lien. */
    @Transactional
    public PublicConsentView answer(String token, String decision, String ip, String userAgent) {
        String normalized = decision == null ? "" : decision.trim().toUpperCase(Locale.ROOT);
        if (!ACCEPT.equals(normalized) && !REFUSE.equals(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Réponse attendue : ACCEPT ou REFUSE.");
        }
        ConsentRequest r = find(token);
        Dossier dossier = dossierRepository.findById(r.getDossierId()).orElse(null);
        if (r.getAnsweredAt() != null) {
            return toView(r, dossier);
        }
        LocalDateTime now = LocalDateTime.now();
        if (r.getExpiresAt().isBefore(now)) {
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Ce lien a expiré. Demandez-en un nouveau à votre conseiller.");
        }

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("source", ConsentementService.SOURCE_CLIENT_LINK);
        meta.put("consentRequestId", r.getId());
        if (ACCEPT.equals(normalized)) {
            meta.put("optInTimestamp", now.toString());
            meta.put("ipAddress", ip != null ? ip : "inconnue");
            meta.put("doubleOptInConfirmed", true);
        } else {
            meta.put("refusedAt", now.toString());
            meta.put("ipAddress", ip != null ? ip : "inconnue");
        }
        if (userAgent != null) {
            meta.put(
                    "userAgent",
                    userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent);
        }

        ConsentementCreateRequest create = new ConsentementCreateRequest();
        create.setDossierId(r.getDossierId());
        create.setChannel(r.getChannel());
        create.setConsentType(r.getConsentType());
        create.setStatus(
                ACCEPT.equals(normalized) ? ConsentementStatus.GRANTED : ConsentementStatus.DENIED);
        create.setMeta(meta);

        // La page publique n'a pas d'organisation : on prend celle du lien le temps de l'écriture.
        String previous = TenantContext.getOrgId();
        TenantContext.setOrgId(r.getOrgId());
        try {
            ConsentementResponse saved = consentementService.create(create);
            r.setConsentementId(saved.getId());
        } finally {
            if (previous == null) {
                TenantContext.clear();
            } else {
                TenantContext.setOrgId(previous);
            }
        }
        r.setAnsweredAt(now);
        r.setDecision(normalized);
        requestRepository.save(r);
        return toView(r, dossier);
    }

    private ConsentRequest find(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            throw notFound();
        }
        return requestRepository.findByTokenHash(hash(token)).orElseThrow(this::notFound);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Ce lien n'existe pas ou n'est plus valable.");
    }

    private PublicConsentView toView(ConsentRequest r, Dossier dossier) {
        String status =
                r.getAnsweredAt() != null
                        ? STATUS_ANSWERED
                        : r.getExpiresAt().isBefore(LocalDateTime.now())
                                ? STATUS_EXPIRED
                                : STATUS_PENDING;
        return new PublicConsentView(
                status,
                r.getDecision(),
                r.getChannel().name(),
                r.getConsentType().name(),
                firstName(dossier),
                r.getExpiresAt());
    }

    static String firstName(Dossier dossier) {
        if (dossier == null || dossier.getLeadName() == null) {
            return null;
        }
        String name = dossier.getLeadName().trim();
        int space = name.indexOf(' ');
        return space > 0 ? name.substring(0, space) : name;
    }

    static String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String currentUser() {
        String user = TenantContext.getUserId();
        if (user != null) {
            return user;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
