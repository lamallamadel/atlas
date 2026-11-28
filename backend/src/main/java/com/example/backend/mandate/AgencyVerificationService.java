package com.example.backend.mandate;

import com.example.backend.entity.AgencyProfileEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.repository.AgencyProfileRepository;
import com.example.backend.repository.AgencyZoneRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.security.AccessPolicy;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Chemin de vérification d'une agence (accès à la bourse aux mandats) : au lieu d'un refus sec,
 * l'agence voit ce qui manque (profil, zones), dépose son registre de commerce et son ICE, puis
 * suit sa demande. L'équipe Atlas valide ou refuse avec un motif.
 */
@Service
public class AgencyVerificationService {

    public static final String PENDING = "PENDING";
    public static final String REJECTED = "REJECTED";
    static final Pattern ICE = Pattern.compile("\\d{15}");

    private final OrganizationRepository organizations;
    private final AgencyProfileRepository profiles;
    private final AgencyZoneRepository zones;
    private final MandateRequestRepository requests;
    private final AgencyDirectoryService directory;
    private final OrgScope orgScope;

    public AgencyVerificationService(
            OrganizationRepository organizations,
            AgencyProfileRepository profiles,
            AgencyZoneRepository zones,
            MandateRequestRepository requests,
            AgencyDirectoryService directory,
            OrgScope orgScope) {
        this.organizations = organizations;
        this.profiles = profiles;
        this.zones = zones;
        this.requests = requests;
        this.directory = directory;
        this.orgScope = orgScope;
    }

    /**
     * {@code status} : {@code VERIFIED}, {@code PENDING}, {@code REJECTED} ou {@code NONE} ; {@code
     * missing} : {@code PROFILE} et/ou {@code ZONES} à compléter avant la demande ; {@code
     * openRequestsInZones} : demandes ouvertes à la bourse dans les villes de l'agence.
     */
    public record Verification(
            String status,
            String rc,
            String ice,
            String contact,
            LocalDateTime requestedAt,
            String note,
            List<String> missing,
            int openRequestsInZones) {}

    public record VerificationRequest(String rc, String ice, String contact) {}

    public record PendingAgency(
            String orgId,
            String name,
            String rc,
            String ice,
            String contact,
            LocalDateTime requestedAt,
            List<String> cities) {}

    // ---------------------------------------------------------------- côté agence

    @Transactional(readOnly = true)
    public Verification mine() {
        String orgId = requireOrg();
        OrganizationEntity org = organizations.findByOrgId(orgId).orElse(null);
        String status =
                org != null && org.isVerified()
                        ? "VERIFIED"
                        : org != null && org.getVerificationStatus() != null
                                ? org.getVerificationStatus()
                                : "NONE";
        return new Verification(
                status,
                org != null ? org.getVerificationRc() : null,
                org != null ? org.getVerificationIce() : null,
                org != null ? org.getVerificationContact() : null,
                org != null ? org.getVerificationRequestedAt() : null,
                org != null ? org.getVerificationNote() : null,
                missing(orgId),
                openRequestsInZones(orgId));
    }

    /** L'administrateur ou le manager de l'agence demande la vérification. */
    @Transactional
    public Verification request(VerificationRequest in) {
        if (!AccessPolicy.isManagerOrAdmin()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN: seuls l'administrateur et les managers demandent la vérification.");
        }
        String orgId = requireOrg();
        OrganizationEntity org =
                organizations
                        .findByOrgId(orgId)
                        .orElseGet(
                                () -> {
                                    OrganizationEntity o = new OrganizationEntity();
                                    o.setOrgId(orgId);
                                    o.setOrgType(OrganizationEntity.TYPE_AGENCY);
                                    o.setDisplayName(orgId);
                                    return o;
                                });
        if (org.isOwner()) {
            throw bad("NOT_AN_AGENCY: cette organisation est celle d'un propriétaire.");
        }
        if (org.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "ALREADY_VERIFIED: votre agence est déjà vérifiée.");
        }
        List<String> missing = missing(orgId);
        if (!missing.isEmpty()) {
            throw bad(
                    "VERIFICATION_INCOMPLETE: complétez d'abord "
                            + (missing.contains("PROFILE") && missing.contains("ZONES")
                                    ? "le profil et les zones"
                                    : missing.contains("PROFILE") ? "le profil" : "les zones")
                            + " de l'agence.");
        }
        String rc = trim(in == null ? null : in.rc());
        String ice = in == null || in.ice() == null ? "" : in.ice().replaceAll("\\s", "");
        if (rc.isEmpty() || rc.length() > 64) {
            throw bad("RC_INVALID: indiquez le numéro du registre de commerce.");
        }
        if (!ICE.matcher(ice).matches()) {
            throw bad("ICE_INVALID: l'ICE compte 15 chiffres.");
        }
        String contact = trim(in.contact());
        org.setVerificationRc(rc);
        org.setVerificationIce(ice);
        org.setVerificationContact(contact.isEmpty() ? null : truncate(contact, 255));
        org.setVerificationStatus(PENDING);
        org.setVerificationRequestedAt(LocalDateTime.now());
        org.setVerificationNote(null);
        organizations.save(org);
        return mine();
    }

    // ---------------------------------------------------------------- plateforme

    @Transactional(readOnly = true)
    public List<PendingAgency> pending() {
        List<PendingAgency> out = new ArrayList<>();
        for (OrganizationEntity o : organizations.findByVerificationStatus(PENDING)) {
            if (o.isVerified() || o.isOwner()) {
                continue;
            }
            List<String> cities =
                    orgScope.unfiltered(
                            () ->
                                    zones
                                            .findByOrgIdOrderByCityAscDistrictAsc(o.getOrgId())
                                            .stream()
                                            .map(z -> z.getCity())
                                            .distinct()
                                            .toList());
            out.add(
                    new PendingAgency(
                            o.getOrgId(),
                            directory.agencyName(o.getOrgId()),
                            o.getVerificationRc(),
                            o.getVerificationIce(),
                            o.getVerificationContact(),
                            o.getVerificationRequestedAt(),
                            cities));
        }
        out.sort(
                Comparator.comparing(
                        PendingAgency::requestedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));
        return out;
    }

    /** Validation ou refus (motif obligatoire) par l'équipe Atlas. */
    @Transactional
    public void decide(String orgId, boolean verified, String note) {
        directory.setVerified(orgId, verified);
        OrganizationEntity org = organizations.findByOrgId(orgId).orElseThrow();
        if (verified) {
            org.setVerificationStatus(null);
            org.setVerificationNote(null);
        } else if (PENDING.equals(org.getVerificationStatus())) {
            String reason = trim(note);
            if (reason.isEmpty()) {
                throw bad("NOTE_REQUIRED: indiquez le motif du refus à l'agence.");
            }
            org.setVerificationStatus(REJECTED);
            org.setVerificationNote(truncate(reason, 500));
        }
        organizations.save(org);
    }

    // ---------------------------------------------------------------- outils

    private List<String> missing(String orgId) {
        List<String> missing = new ArrayList<>();
        AgencyProfileEntity p = profiles.findByOrgId(orgId).orElse(null);
        if (p == null || trim(p.getDisplayName()).isEmpty()) {
            missing.add("PROFILE");
        }
        if (zones.findByOrgIdOrderByCityAscDistrictAsc(orgId).isEmpty()) {
            missing.add("ZONES");
        }
        return missing;
    }

    private int openRequestsInZones(String orgId) {
        List<MandateRequestEntity> open =
                orgScope.unfiltered(
                        () ->
                                requests.findByStatusAndVisibilityOrderByOpenedAtDesc(
                                        MandateRequestEntity.MREQ_OPEN,
                                        MandateRequestEntity.MREQ_OPEN_MARKET));
        return (int) open.stream().filter(r -> directory.covers(orgId, r.getCity())).count();
    }

    private static String requireOrg() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organisation inconnue");
        }
        return orgId;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
