package com.example.backend.service;

import com.example.backend.dto.AnnonceMediaResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Photos d'une annonce : import de fichiers, liens externes, lecture et suppression. */
@Service
public class AnnonceMediaService {

    private static final Logger log = LoggerFactory.getLogger(AnnonceMediaService.class);

    public static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");
    public static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    public static final int MAX_MEDIA_PER_ANNONCE = 60;

    private final AnnonceRepository annonceRepository;
    private final AnnonceMediaRepository mediaRepository;
    private final FileStorageStrategy fileStorageStrategy;

    public AnnonceMediaService(
            AnnonceRepository annonceRepository,
            AnnonceMediaRepository mediaRepository,
            FileStorageStrategy fileStorageStrategy) {
        this.annonceRepository = annonceRepository;
        this.mediaRepository = mediaRepository;
        this.fileStorageStrategy = fileStorageStrategy;
    }

    /** Charge l'annonce en vérifiant qu'elle appartient à l'organisation courante. */
    @Transactional(readOnly = true)
    public Annonce requireAnnonce(Long annonceId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Annonce annonce =
                annonceRepository
                        .findById(annonceId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + annonceId));
        if (!orgId.equals(annonce.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + annonceId);
        }
        return annonce;
    }

    private AnnonceMedia requireMedia(Long annonceId, Long mediaId) {
        Annonce annonce = requireAnnonce(annonceId);
        return mediaRepository
                .findById(mediaId)
                .filter(m -> m.getAnnonceId().equals(annonce.getId()))
                .filter(m -> m.getOrgId().equals(annonce.getOrgId()))
                .orElseThrow(
                        () -> new EntityNotFoundException("Media not found with id: " + mediaId));
    }

    @Transactional(readOnly = true)
    public List<AnnonceMediaResponse> list(Long annonceId) {
        requireAnnonce(annonceId);
        return mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonceId).stream()
                .map(AnnonceMediaService::toResponse)
                .toList();
    }

    @Transactional
    public List<AnnonceMediaResponse> upload(Long annonceId, List<MultipartFile> files) {
        Annonce annonce = requireAnnonce(annonceId);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Aucun fichier reçu");
        }
        long existing = mediaRepository.countByAnnonceId(annonceId);
        if (existing + files.size() > MAX_MEDIA_PER_ANNONCE) {
            throw new IllegalArgumentException(
                    "Une annonce peut avoir au plus " + MAX_MEDIA_PER_ANNONCE + " photos");
        }
        for (MultipartFile file : files) {
            validateImage(file);
        }

        List<AnnonceMedia> saved = new ArrayList<>();
        int position = (int) existing;
        for (MultipartFile file : files) {
            String path;
            try (InputStream in = file.getInputStream()) {
                path =
                        fileStorageStrategy.storeInFolder(
                                annonce.getOrgId(),
                                "annonces/" + annonceId + "/media",
                                file.getOriginalFilename(),
                                in,
                                file.getSize(),
                                file.getContentType());
            } catch (IOException e) {
                throw new IllegalStateException("Lecture du fichier impossible", e);
            }
            AnnonceMedia media = newMedia(annonce, AnnonceMedia.SOURCE_UPLOAD, position++);
            media.setStoragePath(path);
            media.setFileName(file.getOriginalFilename());
            media.setContentType(file.getContentType());
            media.setFileSize(file.getSize());
            saved.add(mediaRepository.save(media));
        }
        log.info("{} photo(s) importée(s) pour l'annonce {}", saved.size(), annonceId);
        return saved.stream().map(AnnonceMediaService::toResponse).toList();
    }

    /**
     * Crée une entrée média pour chaque photo de l'ancien champ {@code photos} (liens) pas encore
     * connue. Seuls les liens https sont analysables.
     */
    @Transactional
    public int syncExternalPhotos(Annonce annonce) {
        if (annonce.getPhotos() == null || annonce.getPhotos().isEmpty()) {
            return 0;
        }
        List<AnnonceMedia> existing =
                mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(annonce.getId());
        Set<String> known = new HashSet<>();
        for (AnnonceMedia m : existing) {
            if (m.getExternalUrl() != null) {
                known.add(m.getExternalUrl());
            }
        }
        int position = existing.size();
        int created = 0;
        for (String url : annonce.getPhotos()) {
            if (url == null || url.isBlank() || !known.add(url.trim())) {
                continue;
            }
            if (position >= MAX_MEDIA_PER_ANNONCE) {
                break;
            }
            AnnonceMedia media = newMedia(annonce, AnnonceMedia.SOURCE_URL, position++);
            media.setExternalUrl(url.trim());
            if (!url.trim().startsWith("https://")) {
                media.setAnalysisStatus(AnnonceMedia.STATUS_REJECTED);
                media.setAnalysisError("Seuls les liens https:// peuvent être analysés");
            }
            mediaRepository.save(media);
            created++;
        }
        return created;
    }

    @Transactional
    public void delete(Long annonceId, Long mediaId) {
        AnnonceMedia media = requireMedia(annonceId, mediaId);
        mediaRepository.delete(media);
        if (media.getStoragePath() != null) {
            try {
                fileStorageStrategy.delete(media.getStoragePath());
            } catch (Exception e) {
                log.warn(
                        "Fichier {} non supprimé du stockage : {}",
                        media.getStoragePath(),
                        e.getMessage());
            }
        }
    }

    public record MediaContent(InputStream stream, String contentType, String fileName) {}

    @Transactional(readOnly = true)
    public MediaContent openContent(Long annonceId, Long mediaId) {
        AnnonceMedia media = requireMedia(annonceId, mediaId);
        if (media.getStoragePath() == null) {
            throw new EntityNotFoundException("Ce média est un lien externe, pas un fichier");
        }
        return new MediaContent(
                fileStorageStrategy.retrieve(media.getStoragePath()),
                media.getContentType(),
                media.getFileName());
    }

    /** Contenu brut d'une photo importée (pour l'analyse). */
    public byte[] readBytes(AnnonceMedia media) throws IOException {
        try (InputStream in = fileStorageStrategy.retrieve(media.getStoragePath())) {
            return in.readAllBytes();
        }
    }

    static void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Fichier trop volumineux (max " + MAX_FILE_SIZE / (1024 * 1024) + " Mo)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Formats acceptés : JPEG, PNG, WebP");
        }
        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            throw new IllegalArgumentException("Fichier illisible", e);
        }
        if (!matchesSignature(contentType, Arrays.copyOf(head, read))) {
            throw new IllegalArgumentException(
                    "Le contenu du fichier ne correspond pas à une image " + contentType);
        }
    }

    /** Vérifie les premiers octets : le type annoncé par le navigateur ne suffit pas. */
    static boolean matchesSignature(String contentType, byte[] h) {
        return switch (contentType) {
            case "image/jpeg" ->
                    h.length >= 3
                            && (h[0] & 0xFF) == 0xFF
                            && (h[1] & 0xFF) == 0xD8
                            && (h[2] & 0xFF) == 0xFF;
            case "image/png" ->
                    h.length >= 4
                            && (h[0] & 0xFF) == 0x89
                            && h[1] == 'P'
                            && h[2] == 'N'
                            && h[3] == 'G';
            case "image/webp" ->
                    h.length >= 12
                            && h[0] == 'R'
                            && h[1] == 'I'
                            && h[2] == 'F'
                            && h[3] == 'F'
                            && h[8] == 'W'
                            && h[9] == 'E'
                            && h[10] == 'B'
                            && h[11] == 'P';
            default -> false;
        };
    }

    private static AnnonceMedia newMedia(Annonce annonce, String source, int position) {
        AnnonceMedia media = new AnnonceMedia();
        media.setOrgId(annonce.getOrgId());
        media.setAnnonceId(annonce.getId());
        media.setMediaType(AnnonceMedia.TYPE_PHOTO);
        media.setSource(source);
        media.setPosition(position);
        media.setAnalysisStatus(AnnonceMedia.STATUS_PENDING);
        return media;
    }

    public static AnnonceMediaResponse toResponse(AnnonceMedia m) {
        String url =
                AnnonceMedia.SOURCE_UPLOAD.equals(m.getSource())
                        ? "/api/v1/annonces/"
                                + m.getAnnonceId()
                                + "/media/"
                                + m.getId()
                                + "/content"
                        : m.getExternalUrl();
        return new AnnonceMediaResponse(
                m.getId(),
                m.getAnnonceId(),
                m.getMediaType(),
                m.getSource(),
                url,
                m.getFileName(),
                m.getContentType(),
                m.getFileSize(),
                m.getPosition(),
                m.getAnalysisStatus(),
                m.getAnalysis(),
                m.getAnalysisEngine(),
                m.getAnalysisError(),
                m.getAnalyzedAt());
    }
}
