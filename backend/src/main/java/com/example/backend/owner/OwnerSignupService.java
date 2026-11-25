package com.example.backend.owner;

import com.example.backend.entity.OrganizationEntity;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.service.AuditEventService;
import com.example.backend.util.TenantContext;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Inscription d'un propriétaire (UC-P1) : code envoyé au téléphone, puis création de son
 * organisation personnelle et de son compte {@code OWNER} (ADR 0005). Un téléphone = un compte.
 */
@Service
public class OwnerSignupService {

    public static final String TERMS_VERSION = "2026-11-25";
    private static final Logger log = LoggerFactory.getLogger(OwnerSignupService.class);
    private static final String ID_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PhoneVerificationService verification;
    private final OrganizationRepository organizations;
    private final OwnerDirectory directory;
    private final AuditEventService audit;

    public OwnerSignupService(
            PhoneVerificationService verification,
            OrganizationRepository organizations,
            OwnerDirectory directory,
            AuditEventService audit) {
        this.verification = verification;
        this.organizations = organizations;
        this.directory = directory;
        this.audit = audit;
    }

    public record StartRequest(String phone) {}

    public record CompleteRequest(
            String phone,
            String code,
            String firstName,
            String lastName,
            String email,
            String password,
            Boolean acceptTerms) {}

    public record SignupResult(String orgId, String username) {}

    /** Étape 1 : envoie le code. Renvoie le canal utilisé. */
    public String start(StartRequest request, String ipAddress) {
        String phone = phone(request.phone());
        if (organizations.existsByOwnerPhone(phone)) {
            throw alreadyRegistered();
        }
        return verification.send(phone, PhoneVerificationService.PURPOSE_OWNER_SIGNUP, ipAddress);
    }

    /**
     * Étape 2 : vérifie le code, crée l'organisation personnelle et le compte. Pas de transaction
     * englobante : l'essai raté d'un code doit être enregistré même si l'inscription échoue.
     */
    public SignupResult complete(CompleteRequest request) {
        String phone = phone(request.phone());
        if (!Boolean.TRUE.equals(request.acceptTerms())) {
            throw bad("TERMS_REQUIRED: acceptez les conditions d'utilisation.");
        }
        if (isBlank(request.firstName()) || isBlank(request.lastName())) {
            throw bad("NAME_REQUIRED: indiquez votre prénom et votre nom.");
        }
        if (request.password() == null || request.password().length() < 8) {
            throw bad("PASSWORD_TOO_SHORT: 8 caractères au moins.");
        }
        if (organizations.existsByOwnerPhone(phone)) {
            throw alreadyRegistered();
        }
        verification.verify(phone, PhoneVerificationService.PURPOSE_OWNER_SIGNUP, request.code());

        String orgId = newOrgId();
        String username = phone.substring(1); // identifiant de connexion : le numéro sans « + »
        String userId =
                directory.createOwner(
                        new OwnerDirectory.OwnerAccount(
                                username,
                                phone,
                                isBlank(request.email()) ? null : request.email().trim(),
                                request.firstName().trim(),
                                request.lastName().trim(),
                                request.password(),
                                orgId));

        OrganizationEntity org = new OrganizationEntity();
        org.setOrgId(orgId);
        org.setOrgType(OrganizationEntity.TYPE_OWNER);
        org.setDisplayName(
                request.firstName().trim() + " " + request.lastName().trim().charAt(0) + ".");
        org.setOwnerUserId(userId);
        org.setOwnerPhone(phone);
        org.setTermsVersion(TERMS_VERSION);
        org.setTermsAcceptedAt(LocalDateTime.now());
        organizations.save(org);

        String previous = TenantContext.getOrgId();
        try {
            TenantContext.setOrgId(orgId);
            audit.logEvent(
                    "ORGANIZATION",
                    org.getId(),
                    "CREATED",
                    "Inscription propriétaire, conditions " + TERMS_VERSION);
        } finally {
            restore(previous);
        }
        log.info(
                "Compte propriétaire créé : org={}, téléphone={}", orgId, PhoneNumbers.mask(phone));
        return new SignupResult(orgId, username);
    }

    private static void restore(String previous) {
        if (previous == null) {
            TenantContext.clear();
        } else {
            TenantContext.setOrgId(previous);
        }
    }

    private static String newOrgId() {
        StringBuilder sb = new StringBuilder("OWN-");
        for (int i = 0; i < 10; i++) {
            sb.append(ID_CHARS.charAt(RANDOM.nextInt(ID_CHARS.length())));
        }
        return sb.toString();
    }

    private static String phone(String raw) {
        return PhoneNumbers.normalize(raw)
                .orElseThrow(() -> bad("PHONE_INVALID: numéro de téléphone invalide."));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException alreadyRegistered() {
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "PHONE_ALREADY_REGISTERED: un compte existe déjà pour ce numéro.");
    }
}
