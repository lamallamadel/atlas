package com.example.backend.service;

import com.example.backend.entity.AnnonceMedia;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.repository.AnnonceMediaRepository;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/**
 * Retrouve la photo d'annonce d'un message WhatsApp de type image (payload {@code type=image},
 * {@code annonceId}, {@code mediaId}). Appelé par le worker d'envoi, hors contexte de requête :
 * l'organisation est vérifiée ici à partir du message.
 */
@Component
public class WhatsAppMediaResolver {

    /** Lien public (photo externe) ou contenu à téléverser chez Meta (photo importée). */
    public record ResolvedImage(String link, byte[] bytes, String contentType, String fileName) {
        public boolean isLink() {
            return link != null;
        }
    }

    public static class MediaUnavailableException extends Exception {
        public MediaUnavailableException(String message) {
            super(message);
        }
    }

    private final AnnonceMediaRepository mediaRepository;
    private final FileStorageStrategy storage;

    public WhatsAppMediaResolver(
            AnnonceMediaRepository mediaRepository,
            @Qualifier("fileStorageStrategy") FileStorageStrategy storage) {
        this.mediaRepository = mediaRepository;
        this.storage = storage;
    }

    public static boolean isImageMessage(OutboundMessageEntity message) {
        Map<String, Object> p = message.getPayloadJson();
        return p != null && "image".equals(p.get("type"));
    }

    public ResolvedImage resolve(OutboundMessageEntity message) throws MediaUnavailableException {
        Map<String, Object> p = message.getPayloadJson();
        Long mediaId = asLong(p != null ? p.get("mediaId") : null);
        Long annonceId = asLong(p != null ? p.get("annonceId") : null);
        if (mediaId == null || annonceId == null) {
            throw new MediaUnavailableException("Photo non précisée");
        }
        AnnonceMedia m =
                mediaRepository
                        .findById(mediaId)
                        .filter(x -> annonceId.equals(x.getAnnonceId()))
                        .filter(x -> Objects.equals(message.getOrgId(), x.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new MediaUnavailableException(
                                                "Photo introuvable : " + mediaId));
        String reason = PitchPhotoSelector.ineligibility(m);
        if (reason != null) {
            throw new MediaUnavailableException("Photo " + mediaId + " : " + reason);
        }
        if (AnnonceMedia.SOURCE_URL.equals(m.getSource())) {
            return new ResolvedImage(m.getExternalUrl(), null, null, null);
        }
        try (InputStream in = storage.retrieve(m.getStoragePath())) {
            byte[] bytes = in.readNBytes((int) PitchPhotoSelector.WHATSAPP_MAX_IMAGE_BYTES + 1);
            if (bytes.length > PitchPhotoSelector.WHATSAPP_MAX_IMAGE_BYTES) {
                throw new MediaUnavailableException("Photo " + mediaId + " : plus de 5 Mo");
            }
            String name = m.getFileName() != null ? m.getFileName() : "photo-" + mediaId;
            return new ResolvedImage(null, bytes, m.getContentType(), name);
        } catch (IOException | RuntimeException e) {
            throw new MediaUnavailableException(
                    "Photo " + mediaId + " illisible : " + e.getMessage());
        }
    }

    private static Long asLong(Object o) {
        if (o instanceof Number n) {
            return n.longValue();
        }
        if (o instanceof String s && !s.isBlank()) {
            try {
                return Long.parseLong(s.strip());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
