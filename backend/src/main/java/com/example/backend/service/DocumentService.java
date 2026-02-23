package com.example.backend.service;

import com.example.backend.dto.DocumentMapper;
import com.example.backend.dto.DocumentResponse;
import com.example.backend.entity.DocumentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.exception.FileValidationException;
import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.DocumentVerifyRequest;
import com.example.backend.brain.dto.DocumentVerifyResponse;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/csv");

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final DocumentRepository documentRepository;
    private final DossierRepository dossierRepository;
    private final DocumentMapper documentMapper;
    private final FileStorageStrategy fileStorageStrategy;
    private final BrainClientService brainClientService;

    @Value("${storage.max-file-size:10485760}")
    private long maxFileSize;

    public DocumentService(
            DocumentRepository documentRepository,
            DossierRepository dossierRepository,
            DocumentMapper documentMapper,
            FileStorageStrategy fileStorageStrategy,
            @Autowired(required = false) @Nullable BrainClientService brainClientService) {
        this.documentRepository = documentRepository;
        this.dossierRepository = dossierRepository;
        this.documentMapper = documentMapper;
        this.fileStorageStrategy = fileStorageStrategy;
        this.brainClientService = brainClientService;
    }

    @Transactional
    public DocumentResponse upload(Long dossierId, MultipartFile file, String category) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository
                .findById(dossierId)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        validateFile(file);

        performVirusScan(file);

        try {
            String fileName = file.getOriginalFilename();
            String contentType = file.getContentType();
            long size = file.getSize();

            InputStream inputStream = file.getInputStream();
            String storagePath = fileStorageStrategy.store(
                    orgId, dossierId, fileName, inputStream, size, contentType);

            DocumentEntity document = new DocumentEntity();
            document.setOrgId(orgId);
            document.setDossierId(dossierId);
            document.setFileName(fileName);
            document.setFileType(extractFileType(fileName));
            document.setFileSize(size);
            document.setStoragePath(storagePath);
            document.setContentType(contentType);
            document.setCategory(category);
            document.setUploadedBy(getCurrentUserId());

            LocalDateTime now = LocalDateTime.now();
            document.setCreatedAt(now);
            document.setUpdatedAt(now);

            DocumentEntity saved = documentRepository.save(document);

            // Appel asynchrone (ou synchrone selon besoin) de l'IA pour vérification
            if ("DPE".equalsIgnoreCase(category) || "AMIANTE".equalsIgnoreCase(category)) {
                performAiVerification(saved);
            }

            logger.info(
                    "Document uploaded successfully: id={}, fileName={}, dossierId={}, category={}",
                    saved.getId(),
                    fileName,
                    dossierId,
                    category);

            return documentMapper.toResponse(saved);
        } catch (Exception e) {
            logger.error("Failed to upload document for dossier: {}", dossierId, e);
            throw new RuntimeException("Failed to upload document", e);
        }
    }

    @Transactional(readOnly = true)
    public InputStream download(Long documentId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        DocumentEntity document = documentRepository
                .findById(documentId)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Document not found with id: " + documentId));

        if (!orgId.equals(document.getOrgId())) {
            throw new EntityNotFoundException("Document not found with id: " + documentId);
        }

        return fileStorageStrategy.retrieve(document.getStoragePath());
    }

    @Transactional
    public void delete(Long documentId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        DocumentEntity document = documentRepository
                .findById(documentId)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Document not found with id: " + documentId));

        if (!orgId.equals(document.getOrgId())) {
            throw new EntityNotFoundException("Document not found with id: " + documentId);
        }

        fileStorageStrategy.delete(document.getStoragePath());

        documentRepository.delete(document);

        logger.info(
                "Document deleted successfully: id={}, fileName={}",
                documentId,
                document.getFileName());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(Long documentId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        DocumentEntity document = documentRepository
                .findById(documentId)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Document not found with id: " + documentId));

        if (!orgId.equals(document.getOrgId())) {
            throw new EntityNotFoundException("Document not found with id: " + documentId);
        }

        return documentMapper.toResponse(document);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> listByDossier(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository
                .findById(dossierId)
                .orElseThrow(
                        () -> new EntityNotFoundException(
                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        Page<DocumentEntity> documents = documentRepository.findByDossierId(dossierId, pageable);
        return documents.map(documentMapper::toResponse);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new FileValidationException(
                    "File size exceeds maximum allowed size of " + maxFileSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileValidationException("File type not allowed: " + contentType);
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.contains("..")) {
            throw new FileValidationException("Invalid file name");
        }
    }

    private void performVirusScan(MultipartFile file) {
        logger.info("Virus scan placeholder - file: {}", file.getOriginalFilename());
    }

    private void performAiVerification(DocumentEntity document) {
        try {
            DocumentVerifyRequest request = new DocumentVerifyRequest();
            request.setDocumentId(document.getId());
            request.setCategory(document.getCategory());
            request.setFileName(document.getFileName());

            Optional<DocumentVerifyResponse> responseOpt = brainClientService.verifyDocument(request);
            if (responseOpt.isPresent()) {
                DocumentVerifyResponse response = responseOpt.get();
                // We update the document directly with the AI's analysis
                // In a real application, you might want to store this in a separate table or
                // JSON column
                String flagStr = response.getFlags() != null && !response.getFlags().isEmpty()
                        ? " | Flags: " + String.join(",", response.getFlags())
                        : "";

                String valStatus = response.isValid() ? "VALIDE" : "INVALIDE";
                // Misusing content_type just as a quick mockup property for frontend display
                document.setContentType(document.getContentType() + " | AI_STATUS:" + valStatus);
                documentRepository.save(document);

                logger.info("AI Verification complete for doc ID {}: Valid={} Confidence={}",
                        document.getId(), response.isValid(), response.getConfidence());
            }
        } catch (Exception e) {
            logger.warn("AI verification failed for document ID {}", document.getId(), e);
        }
    }

    private String extractFileType(String fileName) {
        if (fileName == null) {
            return null;
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex + 1).toLowerCase();
        }
        return null;
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getSubject();
        }
        return "system";
    }
}
