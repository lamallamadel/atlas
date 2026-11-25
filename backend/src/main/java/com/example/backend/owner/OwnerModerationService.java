package com.example.backend.owner;

import com.example.backend.entity.Annonce;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.service.AnnonceMediaService;
import com.example.backend.service.AnnoncePublicationService;
import com.example.backend.service.AuditEventService;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.Session;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * File de modération des annonces de particuliers (R-PROP-04), réservée à la plateforme ({@code
 * SUPER_ADMIN}). Lecture inter-organisations : le filtre d'organisation est levé pour cette seule
 * requête, sur les seules annonces en attente.
 */
@Service
public class OwnerModerationService {

    private final EntityManager entityManager;
    private final AnnonceRepository annonces;
    private final OrganizationRepository organizations;
    private final com.example.backend.service.AnnonceService annonceService;
    private final AnnonceMediaService mediaService;
    private final AuditEventService audit;

    public OwnerModerationService(
            EntityManager entityManager,
            AnnonceRepository annonces,
            OrganizationRepository organizations,
            com.example.backend.service.AnnonceService annonceService,
            AnnonceMediaService mediaService,
            AuditEventService audit) {
        this.entityManager = entityManager;
        this.annonces = annonces;
        this.organizations = organizations;
        this.annonceService = annonceService;
        this.mediaService = mediaService;
        this.audit = audit;
    }

    public record PendingAnnonce(
            Long id,
            String ownerOrgId,
            String ownerName,
            String title,
            String description,
            String city,
            String district,
            BigDecimal price,
            Integer fraudScore,
            String duplicateStatut,
            int photoCount,
            List<Long> photoIds,
            LocalDateTime requestedAt) {}

    @Transactional(readOnly = true)
    public List<PendingAnnonce> pending() {
        acrossOrganizations();
        return annonces
                .findByModerationStatusOrderByUpdatedAtAsc(OwnerAnnonceService.MOD_PENDING)
                .stream()
                .map(this::toPending)
                .toList();
    }

    @Transactional
    public void approve(Long annonceId, String note) {
        Annonce annonce = requirePending(annonceId);
        // Mêmes règles que toute publication (qualité, quota, indexation de la recherche).
        withOrg(
                annonce.getOrgId(),
                () ->
                        annonceService.applyTransition(
                                annonce.getId(), AnnoncePublicationService.T_PUBLISH, null, null));
        Annonce published = annonces.findById(annonceId).orElseThrow();
        decide(published, OwnerAnnonceService.MOD_APPROVED, note, "APPROVED");
    }

    @Transactional
    public void reject(Long annonceId, String note) {
        if (note == null || note.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "NOTE_REQUIRED: expliquez au propriétaire ce qu'il doit corriger.");
        }
        Annonce annonce = requirePending(annonceId);
        decide(annonce, OwnerAnnonceService.MOD_REJECTED, note, "REJECTED");
    }

    /** Photo d'une annonce en attente (pas encore visible sur le portail). */
    @Transactional(readOnly = true)
    public AnnonceMediaService.MediaContent openPhoto(Long annonceId, Long mediaId) {
        Annonce annonce = requirePending(annonceId);
        String previous = TenantContext.getOrgId();
        try {
            TenantContext.setOrgId(annonce.getOrgId());
            return mediaService.openContent(annonceId, mediaId);
        } finally {
            if (previous == null) {
                TenantContext.clear();
            } else {
                TenantContext.setOrgId(previous);
            }
        }
    }

    private void decide(Annonce annonce, String status, String note, String action) {
        annonce.setModerationStatus(status);
        annonce.setModerationNote(note == null || note.isBlank() ? null : note.trim());
        annonce.setModeratedBy(currentUser());
        annonce.setModeratedAt(LocalDateTime.now());
        annonce.setUpdatedAt(LocalDateTime.now());
        annonces.save(annonce);
        withOrg(
                annonce.getOrgId(),
                () -> audit.logEvent("ANNONCE", annonce.getId(), action, "Modération : " + status));
    }

    private Annonce requirePending(Long annonceId) {
        acrossOrganizations();
        return annonces.findById(annonceId)
                .filter(a -> OwnerAnnonceService.MOD_PENDING.equals(a.getModerationStatus()))
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Annonce en attente introuvable"));
    }

    private PendingAnnonce toPending(Annonce a) {
        List<Long> photos =
                mediaService
                        .uploadedPhotoIds(List.of(a.getId()))
                        .getOrDefault(a.getId(), List.of());
        String owner =
                organizations
                        .findByOrgId(a.getOrgId())
                        .map(o -> o.getDisplayName())
                        .orElse(a.getOrgId());
        return new PendingAnnonce(
                a.getId(),
                a.getOrgId(),
                owner,
                a.getTitle(),
                a.getDescription(),
                a.getCity(),
                a.getAddress(),
                a.getPrice(),
                a.getFraudScore(),
                a.getDuplicateStatut(),
                photos.size(),
                photos,
                a.getUpdatedAt());
    }

    private void acrossOrganizations() {
        Session session = entityManager.unwrap(Session.class);
        session.disableFilter("orgIdFilter");
    }

    private static void withOrg(String orgId, Runnable action) {
        String previous = TenantContext.getOrgId();
        try {
            TenantContext.setOrgId(orgId);
            action.run();
        } finally {
            if (previous == null) {
                TenantContext.clear();
            } else {
                TenantContext.setOrgId(previous);
            }
        }
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
