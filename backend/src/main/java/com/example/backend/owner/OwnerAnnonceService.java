package com.example.backend.owner;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceMediaResponse;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.service.AnnonceMediaService;
import com.example.backend.service.AnnoncePublicationService;
import com.example.backend.service.AnnonceService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Annonce publiée par le propriétaire lui-même (UC-P3), une par bien. Mêmes règles de publication
 * que les agences ; la première annonce d'un propriétaire, ou une annonce au score de fraude élevé,
 * attend la modération de la plateforme (R-PROP-04). L'adresse précise du bien n'est jamais
 * recopiée dans l'annonce : seul le quartier l'est (R-PROP-02).
 */
@Service
public class OwnerAnnonceService {

    public static final String PUBLISHER_OWNER = "OWNER";
    public static final String MOD_PENDING = "MOD_PENDING";
    public static final String MOD_APPROVED = "MOD_APPROVED";
    public static final String MOD_REJECTED = "MOD_REJECTED";

    private final OwnerPropertyService propertyService;
    private final AnnonceService annonceService;
    private final AnnonceRepository annonces;
    private final AnnonceMediaService mediaService;
    private final AnnoncePublicationService publicationService;
    private final int fraudThreshold;

    public OwnerAnnonceService(
            OwnerPropertyService propertyService,
            AnnonceService annonceService,
            AnnonceRepository annonces,
            AnnonceMediaService mediaService,
            AnnoncePublicationService publicationService,
            @Value("${atlas.owner.moderation.fraud-threshold:50}") int fraudThreshold) {
        this.propertyService = propertyService;
        this.annonceService = annonceService;
        this.annonces = annonces;
        this.mediaService = mediaService;
        this.publicationService = publicationService;
        this.fraudThreshold = fraudThreshold;
    }

    public record ListingRequest(String title, String description, BigDecimal price) {}

    public record OwnerAnnonceView(
            Long id,
            Long propertyId,
            String title,
            String description,
            BigDecimal price,
            String currency,
            String status,
            String moderationStatus,
            String moderationNote,
            List<String> blockers,
            List<AnnonceMediaResponse> photos) {}

    @Transactional(readOnly = true)
    public OwnerAnnonceView view(Long propertyId) {
        PropertyEntity property = propertyService.get(propertyId);
        return annonces.findFirstByOrgIdAndPropertyId(property.getOrgId(), property.getId())
                .map(this::toView)
                .orElse(null);
    }

    /**
     * Crée ou met à jour l'annonce du bien (toujours en brouillon tant qu'elle n'est pas publiée).
     */
    @Transactional
    public OwnerAnnonceView save(Long propertyId, ListingRequest request) {
        PropertyEntity property = propertyService.get(propertyId);
        Annonce annonce =
                annonces.findFirstByOrgIdAndPropertyId(property.getOrgId(), property.getId())
                        .orElse(null);
        if (annonce == null) {
            AnnonceCreateRequest create = new AnnonceCreateRequest();
            create.setTitle(text(request.title(), property.getTitle()));
            create.setDescription(text(request.description(), property.getDescription()));
            create.setPrice(
                    request.price() != null ? request.price() : property.getExpectedPrice());
            create.setCurrency("MAD");
            fillFromProperty(create, property);
            AnnonceResponse created = annonceService.create(create);
            annonce = annonces.findById(created.getId()).orElseThrow();
            annonce.setPropertyId(property.getId());
            annonce.setPublisherKind(PUBLISHER_OWNER);
        } else {
            annonce.setTitle(text(request.title(), annonce.getTitle()));
            annonce.setDescription(text(request.description(), annonce.getDescription()));
            if (request.price() != null) {
                annonce.setPrice(request.price());
            }
            annonce.setCity(property.getCity());
            annonce.setAddress(property.getDistrict());
            annonce.setSurface(property.getSurface());
            // Une annonce refusée repart en brouillon modifiable ; la redemande repasse en
            // modération.
            if (MOD_REJECTED.equals(annonce.getModerationStatus())) {
                annonce.setModerationStatus(null);
            }
            annonce.setUpdatedAt(LocalDateTime.now());
        }
        return toView(annonces.save(annonce));
    }

    @Transactional
    public List<AnnonceMediaResponse> addPhotos(Long propertyId, List<MultipartFile> files) {
        Annonce annonce = require(propertyId);
        return mediaService.upload(annonce.getId(), files);
    }

    @Transactional
    public void deletePhoto(Long propertyId, Long mediaId) {
        Annonce annonce = require(propertyId);
        mediaService.delete(annonce.getId(), mediaId);
    }

    /**
     * Demande de publication : publiée tout de suite si le propriétaire a déjà une annonce validée
     * et que le score de fraude est bas, sinon mise en attente de modération.
     */
    @Transactional
    public OwnerAnnonceView requestPublication(Long propertyId) {
        Annonce annonce = require(propertyId);
        AnnonceStatus status = AnnonceStatus.normalize(annonce.getStatus());
        if (status == AnnonceStatus.PUBLISHED
                || MOD_PENDING.equals(annonce.getModerationStatus())) {
            return toView(annonce);
        }
        List<AnnoncePublicationService.Blocker> blockers =
                publicationService.publicationBlockers(annonce);
        if (!blockers.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PUBLICATION_BLOCKED: "
                            + String.join(
                                    " ; ",
                                    blockers.stream()
                                            .map(AnnoncePublicationService.Blocker::message)
                                            .toList()));
        }
        boolean trusted =
                annonces.existsByOrgIdAndModerationStatus(annonce.getOrgId(), MOD_APPROVED);
        boolean suspicious =
                annonce.getFraudScore() != null && annonce.getFraudScore() >= fraudThreshold;
        if (trusted && !suspicious) {
            annonceService.applyTransition(
                    annonce.getId(), AnnoncePublicationService.T_PUBLISH, null, null);
            annonce = annonces.findById(annonce.getId()).orElseThrow();
            annonce.setModerationStatus(MOD_APPROVED);
            annonce.setModeratedBy("auto");
            annonce.setModeratedAt(LocalDateTime.now());
        } else {
            annonce.setModerationStatus(MOD_PENDING);
            annonce.setModerationNote(null);
        }
        annonce.setUpdatedAt(LocalDateTime.now());
        return toView(annonces.save(annonce));
    }

    /** Retire l'annonce du portail (le propriétaire met en pause). */
    @Transactional
    public OwnerAnnonceView withdraw(Long propertyId) {
        Annonce annonce = require(propertyId);
        if (MOD_PENDING.equals(annonce.getModerationStatus())) {
            annonce.setModerationStatus(null);
            return toView(annonces.save(annonce));
        }
        annonceService.applyTransition(
                annonce.getId(),
                AnnoncePublicationService.T_SUSPEND,
                "OWNER_PAUSE",
                "Retirée par le propriétaire");
        return toView(annonces.findById(annonce.getId()).orElseThrow());
    }

    private Annonce require(Long propertyId) {
        PropertyEntity property = propertyService.get(propertyId);
        return annonces.findFirstByOrgIdAndPropertyId(property.getOrgId(), property.getId())
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "NO_ANNONCE: rédigez d'abord l'annonce du bien."));
    }

    private static void fillFromProperty(AnnonceCreateRequest create, PropertyEntity property) {
        create.setType(
                "RENT".equals(property.getTransactionType()) ? AnnonceType.RENT : AnnonceType.SALE);
        create.setCategory(property.getPropertyType());
        create.setCity(property.getCity());
        create.setAddress(property.getDistrict());
        create.setSurface(property.getSurface());
        Map<String, Object> meta = new HashMap<>();
        if (property.getRooms() != null) {
            meta.put("rooms", property.getRooms());
        }
        create.setMeta(meta);
    }

    private OwnerAnnonceView toView(Annonce a) {
        List<String> blockers =
                AnnonceStatus.normalize(a.getStatus()) == AnnonceStatus.PUBLISHED
                        ? List.of()
                        : publicationService.publicationBlockers(a).stream()
                                .map(AnnoncePublicationService.Blocker::message)
                                .toList();
        return new OwnerAnnonceView(
                a.getId(),
                a.getPropertyId(),
                a.getTitle(),
                a.getDescription(),
                a.getPrice(),
                a.getCurrency(),
                AnnonceStatus.normalize(a.getStatus()).name(),
                a.getModerationStatus(),
                a.getModerationNote(),
                blockers,
                mediaService.list(a.getId()));
    }

    private static String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
