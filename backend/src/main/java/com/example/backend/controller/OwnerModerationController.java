package com.example.backend.controller;

import com.example.backend.owner.OwnerModerationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Modération a priori des annonces de particuliers (R-PROP-04), par la plateforme. */
@RestController
@RequestMapping("/api/v1/admin/moderation/owner-annonces")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Owner moderation", description = "File de modération des annonces de particuliers")
public class OwnerModerationController {

    private final OwnerModerationService moderation;

    public OwnerModerationController(OwnerModerationService moderation) {
        this.moderation = moderation;
    }

    @GetMapping
    public List<OwnerModerationService.PendingAnnonce> pending() {
        return moderation.pending();
    }

    @GetMapping("/{id}/photos/{mediaId}")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> photo(
            @PathVariable Long id, @PathVariable Long mediaId) {
        com.example.backend.service.AnnonceMediaService.MediaContent content =
                moderation.openPhoto(id, mediaId);
        String type = content.contentType() == null ? "image/jpeg" : content.contentType();
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(type))
                .body(new org.springframework.core.io.InputStreamResource(content.stream()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(
            @PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        moderation.approve(id, body == null ? null : body.get("note"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        moderation.reject(id, body.get("note"));
        return ResponseEntity.noContent().build();
    }
}
