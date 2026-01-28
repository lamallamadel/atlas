package com.example.backend.service;

import com.example.backend.entity.DocumentAuditEntity;
import com.example.backend.entity.DocumentEntity;
import com.example.backend.entity.DocumentVersionEntity;
import com.example.backend.entity.enums.DocumentActionType;
import com.example.backend.repository.DocumentAuditRepository;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.DocumentVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentVersionService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentVersionService.class);

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;
    private final DocumentAuditRepository auditRepository;

    public DocumentVersionService(
            DocumentVersionRepository versionRepository,
            DocumentRepository documentRepository,
            DocumentAuditRepository auditRepository) {
        this.versionRepository = versionRepository;
        this.documentRepository = documentRepository;
        this.auditRepository = auditRepository;
    }

    @Transactional
    public DocumentVersionEntity createVersion(Long documentId, MultipartFile file, String versionNotes,
                                                String orgId, String userId) throws IOException, NoSuchAlgorithmException {
        DocumentEntity document = documentRepository.findByIdAndOrgId(documentId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        versionRepository.findByDocumentIdAndIsCurrentTrueAndOrgId(documentId, orgId)
                .ifPresent(currentVersion -> {
                    currentVersion.setIsCurrent(false);
                    versionRepository.save(currentVersion);
                });

        Integer maxVersion = versionRepository.findMaxVersionNumber(documentId, orgId);
        Integer newVersionNumber = (maxVersion != null ? maxVersion : 0) + 1;

        String storagePath = saveFile(file, orgId, documentId, newVersionNumber);
        String checksum = calculateChecksum(file.getBytes());

        DocumentVersionEntity version = new DocumentVersionEntity();
        version.setOrgId(orgId);
        version.setDocumentId(documentId);
        version.setVersionNumber(newVersionNumber);
        version.setFileName(file.getOriginalFilename());
        version.setFileSize(file.getSize());
        version.setStoragePath(storagePath);
        version.setContentType(file.getContentType());
        version.setChecksum(checksum);
        version.setVersionNotes(versionNotes);
        version.setIsCurrent(true);
        version.setUploadedBy(userId);
        version.setCreatedBy(userId);

        version = versionRepository.save(version);

        logAudit(documentId, null, version.getId(), DocumentActionType.VERSION_CREATED,
                userId, "Version " + newVersionNumber + " created", orgId);

        return version;
    }

    public List<DocumentVersionEntity> getVersions(Long documentId, String orgId) {
        return versionRepository.findByDocumentIdAndOrgIdOrderByVersionNumberDesc(documentId, orgId);
    }

    public DocumentVersionEntity getCurrentVersion(Long documentId, String orgId) {
        return versionRepository.findByDocumentIdAndIsCurrentTrueAndOrgId(documentId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("No current version found"));
    }

    @Transactional
    public void restoreVersion(Long documentId, Integer versionNumber, String orgId, String userId) {
        DocumentVersionEntity versionToRestore = versionRepository.findByDocumentIdAndVersionNumberAndOrgId(documentId, versionNumber, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        versionRepository.findByDocumentIdAndIsCurrentTrueAndOrgId(documentId, orgId)
                .ifPresent(currentVersion -> {
                    currentVersion.setIsCurrent(false);
                    versionRepository.save(currentVersion);
                });

        versionToRestore.setIsCurrent(true);
        versionRepository.save(versionToRestore);

        logAudit(documentId, null, versionToRestore.getId(), DocumentActionType.VERSION_CREATED,
                userId, "Version " + versionNumber + " restored", orgId);
    }

    public Map<String, Object> compareVersions(Long documentId, Integer fromVersion, Integer toVersion, String orgId) {
        DocumentVersionEntity from = versionRepository.findByDocumentIdAndVersionNumberAndOrgId(documentId, fromVersion, orgId)
                .orElseThrow(() -> new IllegalArgumentException("From version not found"));

        DocumentVersionEntity to = versionRepository.findByDocumentIdAndVersionNumberAndOrgId(documentId, toVersion, orgId)
                .orElseThrow(() -> new IllegalArgumentException("To version not found"));

        Map<String, Object> comparison = new HashMap<>();
        comparison.put("fromVersion", fromVersion);
        comparison.put("toVersion", toVersion);
        comparison.put("fromFileName", from.getFileName());
        comparison.put("toFileName", to.getFileName());
        comparison.put("fromFileSize", from.getFileSize());
        comparison.put("toFileSize", to.getFileSize());
        comparison.put("fileSizeDiff", to.getFileSize() - from.getFileSize());
        comparison.put("fromChecksum", from.getChecksum());
        comparison.put("toChecksum", to.getChecksum());
        comparison.put("checksumMatch", from.getChecksum().equals(to.getChecksum()));
        comparison.put("fromCreatedAt", from.getCreatedAt());
        comparison.put("toCreatedAt", to.getCreatedAt());
        comparison.put("fromUploadedBy", from.getUploadedBy());
        comparison.put("toUploadedBy", to.getUploadedBy());

        List<Map<String, String>> changes = new ArrayList<>();
        if (!from.getFileName().equals(to.getFileName())) {
            changes.add(Map.of("field", "fileName", "from", from.getFileName(), "to", to.getFileName()));
        }
        if (!from.getFileSize().equals(to.getFileSize())) {
            changes.add(Map.of("field", "fileSize", "from", from.getFileSize().toString(), "to", to.getFileSize().toString()));
        }
        if (!from.getChecksum().equals(to.getChecksum())) {
            changes.add(Map.of("field", "content", "from", "Changed", "to", "Changed"));
        }
        comparison.put("changes", changes);

        return comparison;
    }

    private String saveFile(MultipartFile file, String orgId, Long documentId, Integer versionNumber) throws IOException {
        String baseDir = "uploads/documents/" + orgId + "/" + documentId + "/versions/";
        Path directory = Paths.get(baseDir);
        Files.createDirectories(directory);

        String fileName = "v" + versionNumber + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = directory.resolve(fileName);
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    private String calculateChecksum(byte[] data) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(data);
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private void logAudit(Long documentId, Long workflowId, Long versionId, DocumentActionType actionType,
                          String userId, String description, String orgId) {
        DocumentAuditEntity audit = new DocumentAuditEntity();
        audit.setOrgId(orgId);
        audit.setDocumentId(documentId);
        audit.setWorkflowId(workflowId);
        audit.setVersionId(versionId);
        audit.setActionType(actionType);
        audit.setActionBy(userId);
        audit.setActionAt(LocalDateTime.now());
        audit.setDescription(description);
        audit.setCreatedBy(userId);
        auditRepository.save(audit);
    }
}
