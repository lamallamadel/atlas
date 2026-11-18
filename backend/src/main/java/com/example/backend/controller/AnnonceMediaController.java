package com.example.backend.controller;

import com.example.backend.brain.VisionAnalysisService;
import com.example.backend.dto.AnnonceMediaResponse;
import com.example.backend.dto.VisionStatusResponse;
import com.example.backend.service.AnnonceMediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Photos d'une annonce et leur analyse visuelle par IA (lecture seule des images). */
@RestController
@RequestMapping("/api/v1/annonces/{annonceId}")
@Tag(name = "Annonce media & vision", description = "Photos d'annonce et analyse visuelle IA")
public class AnnonceMediaController {

    private final AnnonceMediaService mediaService;
    private final VisionAnalysisService visionService;

    public AnnonceMediaController(
            AnnonceMediaService mediaService, VisionAnalysisService visionService) {
        this.mediaService = mediaService;
        this.visionService = visionService;
    }

    @GetMapping("/media")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Lister les photos de l'annonce")
    public List<AnnonceMediaResponse> list(@PathVariable Long annonceId) {
        return mediaService.list(annonceId);
    }

    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Importer des photos (JPEG, PNG, WebP, 10 Mo max chacune)")
    public ResponseEntity<List<AnnonceMediaResponse>> upload(
            @PathVariable Long annonceId, @RequestPart("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mediaService.upload(annonceId, files));
    }

    @GetMapping("/media/{mediaId}/content")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Contenu d'une photo importée")
    public ResponseEntity<InputStreamResource> content(
            @PathVariable Long annonceId, @PathVariable Long mediaId) {
        AnnonceMediaService.MediaContent content = mediaService.openContent(annonceId, mediaId);
        MediaType type =
                content.contentType() != null
                        ? MediaType.parseMediaType(content.contentType())
                        : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(new InputStreamResource(content.stream()));
    }

    @DeleteMapping("/media/{mediaId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Supprimer une photo")
    public ResponseEntity<Void> delete(@PathVariable Long annonceId, @PathVariable Long mediaId) {
        mediaService.delete(annonceId, mediaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/vision/analyze")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Lancer l'analyse visuelle des photos",
            description =
                    "Analyse en arrière-plan les photos en attente (force=true : toutes). Suivre"
                            + " l'avancement avec GET /vision.")
    public ResponseEntity<VisionStatusResponse> analyze(
            @PathVariable Long annonceId,
            @RequestParam(name = "force", defaultValue = "false") boolean force) {
        return ResponseEntity.accepted().body(visionService.requestAnalysis(annonceId, force));
    }

    @GetMapping("/vision")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "État de l'analyse visuelle et profil extrait")
    public VisionStatusResponse status(@PathVariable Long annonceId) {
        return visionService.status(annonceId);
    }

    public record ApplyDescriptionRequest(@NotBlank String description) {}

    @PostMapping("/vision/apply-description")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Remplacer la description de l'annonce par le texte validé par l'agent")
    public ResponseEntity<Void> applyDescription(
            @PathVariable Long annonceId, @RequestBody ApplyDescriptionRequest request) {
        visionService.applyDescription(annonceId, request.description());
        return ResponseEntity.noContent().build();
    }
}
