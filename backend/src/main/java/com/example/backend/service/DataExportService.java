package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataExportService {

    private static final Logger logger = LoggerFactory.getLogger(DataExportService.class);

    private final DataExportRequestRepository exportRequestRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;
    private final ActivityRepository activityRepository;
    private final MessageRepository messageRepository;
    private final DocumentRepository documentRepository;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public DataExportService(
            DataExportRequestRepository exportRequestRepository,
            DossierRepository dossierRepository,
            PartiePrenanteRepository partiePrenanteRepository,
            ActivityRepository activityRepository,
            MessageRepository messageRepository,
            DocumentRepository documentRepository,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper) {
        this.exportRequestRepository = exportRequestRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
        this.activityRepository = activityRepository;
        this.messageRepository = messageRepository;
        this.documentRepository = documentRepository;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DataExportRequestEntity createExportRequest(
            String orgId,
            String requestType,
            String requesterEmail,
            String requesterUserId,
            String exportFormat,
            boolean includeDocuments,
            boolean includeAuditLogs) {

        logger.info("Creating data export request for orgId={}, type={}", orgId, requestType);

        DataExportRequestEntity request = new DataExportRequestEntity();
        request.setOrgId(orgId);
        request.setRequestType(requestType);
        request.setRequesterEmail(requesterEmail);
        request.setRequesterUserId(requesterUserId);
        request.setExportFormat(exportFormat);
        request.setIncludeDocuments(includeDocuments);
        request.setIncludeAuditLogs(includeAuditLogs);
        request.setStatus("pending");

        return exportRequestRepository.save(request);
    }

    @Async
    @Transactional
    public void processExportRequest(Long requestId) {
        logger.info("Processing data export request: {}", requestId);

        DataExportRequestEntity request =
                exportRequestRepository
                        .findById(requestId)
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "Export request not found: " + requestId));

        try {
            request.setStatus("processing");
            request.setProcessingStartedAt(LocalDateTime.now());
            exportRequestRepository.save(request);

            String exportPath = generateExportFile(request);

            File exportFile = new File(exportPath);
            long fileSize = exportFile.length();

            String downloadUrl = generateDownloadUrl(request.getId());
            LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

            request.setStatus("completed");
            request.setExportFilePath(exportPath);
            request.setExportFileSizeBytes(fileSize);
            request.setDownloadUrl(downloadUrl);
            request.setDownloadUrlExpiresAt(expiresAt);
            request.setProcessingCompletedAt(LocalDateTime.now());
            exportRequestRepository.save(request);

            logger.info("Data export completed: {}", requestId);

        } catch (Exception e) {
            logger.error("Data export failed: {}", requestId, e);
            request.setStatus("failed");
            request.setErrorMessage(e.getMessage());
            exportRequestRepository.save(request);
        }
    }

    private String generateExportFile(DataExportRequestEntity request) throws Exception {
        String orgId = request.getOrgId();
        String timestamp =
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename =
                String.format("export_%s_%s.%s", orgId, timestamp, request.getExportFormat());

        Path exportDir = Paths.get(System.getProperty("java.io.tmpdir"), "data-exports");
        Files.createDirectories(exportDir);

        String exportPath = exportDir.resolve(filename).toString();

        Map<String, Object> exportData = new HashMap<>();
        exportData.put("exportMetadata", buildExportMetadata(request));
        exportData.put("dossiers", collectDossiers(orgId));
        exportData.put("parties", collectParties(orgId));
        exportData.put("activities", collectActivities(orgId));
        exportData.put("messages", collectMessages(orgId));

        if (request.getIncludeDocuments()) {
            exportData.put("documents", collectDocuments(orgId));
        }

        if (request.getIncludeAuditLogs()) {
            exportData.put("auditLogs", collectAuditLogs(orgId));
        }

        if ("json".equals(request.getExportFormat())) {
            try (FileWriter writer = new FileWriter(exportPath)) {
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(writer, exportData);
            }
        }

        return exportPath;
    }

    private Map<String, Object> buildExportMetadata(DataExportRequestEntity request) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("orgId", request.getOrgId());
        metadata.put("exportDate", LocalDateTime.now().toString());
        metadata.put("requestType", request.getRequestType());
        metadata.put("format", request.getExportFormat());
        return metadata;
    }

    private List<Map<String, Object>> collectDossiers(String orgId) {
        List<Map<String, Object>> data = new ArrayList<>();
        return data;
    }

    private List<Map<String, Object>> collectParties(String orgId) {
        return new ArrayList<>();
    }

    private List<Map<String, Object>> collectActivities(String orgId) {
        return new ArrayList<>();
    }

    private List<Map<String, Object>> collectMessages(String orgId) {
        return new ArrayList<>();
    }

    private List<Map<String, Object>> collectDocuments(String orgId) {
        return new ArrayList<>();
    }

    private List<Map<String, Object>> collectAuditLogs(String orgId) {
        return new ArrayList<>();
    }

    private String generateDownloadUrl(Long requestId) {
        return "/api/v1/data-export/download/" + requestId;
    }

    public Optional<DataExportRequestEntity> getExportRequest(Long id) {
        return exportRequestRepository.findById(id);
    }

    public List<DataExportRequestEntity> getExportRequestsByOrgId(String orgId) {
        return exportRequestRepository.findByOrgIdOrderByCreatedAtDesc(orgId);
    }

    @Transactional
    public void incrementDownloadCount(Long requestId) {
        DataExportRequestEntity request =
                exportRequestRepository
                        .findById(requestId)
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "Export request not found: " + requestId));

        request.setDownloadCount(request.getDownloadCount() + 1);
        exportRequestRepository.save(request);

        logger.info("Download count incremented for export request: {}", requestId);
    }
}
