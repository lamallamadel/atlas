package com.example.backend.controller;

import com.example.backend.dto.AnnonceMediaResponse;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.owner.LeadConversationService;
import com.example.backend.owner.OwnerAnnonceService;
import com.example.backend.owner.OwnerContext;
import com.example.backend.owner.OwnerLeadService;
import com.example.backend.owner.OwnerPropertyService;
import com.example.backend.service.AnnonceMediaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Espace propriétaire (cas d'usage n°1, lot A) : profil, biens, annonce du bien, photos,
 * publication, contacts. Réservé au rôle {@code OWNER} sur son organisation personnelle.
 */
@RestController
@RequestMapping("/api/v1/owner")
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Owner space", description = "Espace propriétaire")
public class OwnerSpaceController {

    private final OwnerContext ownerContext;
    private final OwnerPropertyService properties;
    private final OwnerAnnonceService annonces;
    private final OwnerLeadService leads;
    private final AnnonceMediaService mediaService;
    private final LeadConversationService conversations;
    private final com.example.backend.owner.PriceReferenceService priceReference;

    public OwnerSpaceController(
            OwnerContext ownerContext,
            OwnerPropertyService properties,
            OwnerAnnonceService annonces,
            OwnerLeadService leads,
            AnnonceMediaService mediaService,
            LeadConversationService conversations,
            com.example.backend.owner.PriceReferenceService priceReference) {
        this.conversations = conversations;
        this.priceReference = priceReference;
        this.ownerContext = ownerContext;
        this.properties = properties;
        this.annonces = annonces;
        this.leads = leads;
        this.mediaService = mediaService;
    }

    public record OwnerProfile(String displayName, String phone, LocalDateTime memberSince) {}

    /** Bien tel que son propriétaire le voit (adresse et titre foncier compris). */
    public record PropertyView(
            Long id,
            String title,
            String propertyType,
            String transactionType,
            String city,
            String district,
            String address,
            Double surface,
            Integer rooms,
            BigDecimal expectedPrice,
            String currency,
            String description,
            String landTitleNumber,
            String verificationStatus,
            OwnerAnnonceService.OwnerAnnonceView annonce) {}

    @GetMapping("/me")
    public OwnerProfile me() {
        OrganizationEntity org = ownerContext.requireOwnerOrg();
        return new OwnerProfile(org.getDisplayName(), org.getOwnerPhone(), org.getCreatedAt());
    }

    @GetMapping("/properties")
    public List<PropertyView> listProperties() {
        return properties.list().stream().map(p -> view(p, annonces.view(p.getId()))).toList();
    }

    @PostMapping("/properties")
    public ResponseEntity<PropertyView> createProperty(
            @RequestBody OwnerPropertyService.PropertyRequest request) {
        PropertyEntity p = properties.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(view(p, null));
    }

    @GetMapping("/properties/{id}")
    public PropertyView getProperty(@PathVariable Long id) {
        return view(properties.get(id), annonces.view(id));
    }

    /** Repère de prix : prix affichés des annonces comparables du quartier ou de la ville. */
    @GetMapping("/properties/{id}/price-reference")
    public com.example.backend.owner.PriceReferenceService.PriceReference priceReference(
            @PathVariable Long id) {
        return priceReference.forOwnerProperty(id);
    }

    @PutMapping("/properties/{id}")
    public PropertyView updateProperty(
            @PathVariable Long id, @RequestBody OwnerPropertyService.PropertyRequest request) {
        return view(properties.update(id, request), annonces.view(id));
    }

    @PutMapping("/properties/{id}/annonce")
    public OwnerAnnonceService.OwnerAnnonceView saveAnnonce(
            @PathVariable Long id, @RequestBody OwnerAnnonceService.ListingRequest request) {
        return annonces.save(id, request);
    }

    @PostMapping(
            value = "/properties/{id}/annonce/photos",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<AnnonceMediaResponse> addPhotos(
            @PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        return annonces.addPhotos(id, files);
    }

    @DeleteMapping("/properties/{id}/annonce/photos/{mediaId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id, @PathVariable Long mediaId) {
        annonces.deletePhoto(id, mediaId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/properties/{id}/annonce/photos/{mediaId}/content")
    public ResponseEntity<InputStreamResource> photo(
            @PathVariable Long id, @PathVariable Long mediaId) {
        OwnerAnnonceService.OwnerAnnonceView annonce = annonces.view(id);
        if (annonce == null) {
            return ResponseEntity.notFound().build();
        }
        AnnonceMediaService.MediaContent content = mediaService.openContent(annonce.id(), mediaId);
        String type = content.contentType() == null ? "image/jpeg" : content.contentType();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type))
                .body(new InputStreamResource(content.stream()));
    }

    @PostMapping("/properties/{id}/annonce/publish")
    public OwnerAnnonceService.OwnerAnnonceView publish(@PathVariable Long id) {
        return annonces.requestPublication(id);
    }

    @PostMapping("/properties/{id}/annonce/withdraw")
    public OwnerAnnonceService.OwnerAnnonceView withdraw(@PathVariable Long id) {
        return annonces.withdraw(id);
    }

    @GetMapping("/leads")
    public List<OwnerLeadService.OwnerLead> leads() {
        return leads.list();
    }

    @PutMapping("/leads/{id}/status")
    public OwnerLeadService.OwnerLead changeLeadStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return leads.changeStatus(id, body.get("statusCode"));
    }

    public record MessageBody(String body) {}

    public record SlotsBody(List<LeadConversationService.SlotRequest> slots) {}

    /** Fil d'échanges avec le prospect ; marque ses messages comme lus. */
    @GetMapping("/leads/{id}/conversation")
    public LeadConversationService.OwnerConversation conversation(@PathVariable Long id) {
        return conversations.ownerView(id);
    }

    @PostMapping("/leads/{id}/messages")
    public LeadConversationService.OwnerConversation sendMessage(
            @PathVariable Long id, @RequestBody MessageBody body) {
        return conversations.ownerSend(id, body == null ? null : body.body());
    }

    /** Propose 1 à 3 créneaux de visite ; remplace les créneaux encore en attente. */
    @PostMapping("/leads/{id}/visit-proposals")
    public LeadConversationService.OwnerConversation proposeVisits(
            @PathVariable Long id, @RequestBody SlotsBody body) {
        return conversations.proposeVisits(id, body == null ? null : body.slots());
    }

    @DeleteMapping("/leads/{id}/visit-proposals")
    public LeadConversationService.OwnerConversation withdrawProposals(@PathVariable Long id) {
        return conversations.withdrawProposals(id);
    }

    @PostMapping("/leads/{id}/visits/{appointmentId}/cancel")
    public LeadConversationService.OwnerConversation cancelVisit(
            @PathVariable Long id, @PathVariable Long appointmentId) {
        return conversations.cancelVisit(id, appointmentId);
    }

    private static PropertyView view(
            PropertyEntity p, OwnerAnnonceService.OwnerAnnonceView annonce) {
        return new PropertyView(
                p.getId(),
                p.getTitle(),
                p.getPropertyType(),
                p.getTransactionType(),
                p.getCity(),
                p.getDistrict(),
                p.getAddress(),
                p.getSurface(),
                p.getRooms(),
                p.getExpectedPrice(),
                p.getCurrency(),
                p.getDescription(),
                p.getLandTitleNumber(),
                p.getVerificationStatus(),
                annonce);
    }
}
