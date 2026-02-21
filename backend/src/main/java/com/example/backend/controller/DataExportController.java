package com.example.backend.controller;

import com.example.backend.entity.DataExportRequestEntity;
import com.example.backend.service.DataExportService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/data-export")
@Tag(name = "Data Export", description = "GDPR-compliant data export APIs")
public class DataExportController {

    private final DataExportService exportService;

    public DataExportController(DataExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/request")
    @Operation(summary = "Request data export (GDPR data portability)")
    public ResponseEntity<DataExportRequestEntity> requestDataExport(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        String orgId = TenantContext.getOrgId();
        String requestType = (String) request.getOrDefault("requestType", "full");
        String exportFormat = (String) request.getOrDefault("exportFormat", "json");
        Boolean includeDocuments = (Boolean) request.getOrDefault("includeDocuments", true);
        Boolean includeAuditLogs = (Boolean) request.getOrDefault("includeAuditLogs", false);
        
        String requesterEmail = authentication.getName();
        String requesterUserId = (String) authentication.getPrincipal();

        DataExportRequestEntity exportRequest = exportService.createExportRequest(
            orgId, requestType, requesterEmail, requesterUserId, 
            exportFormat, includeDocuments, includeAuditLogs
        );

        exportService.processExportRequest(exportRequest.getId());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(exportRequest);
    }

    @GetMapping("/requests")
    @Operation(summary = "Get all export requests for current tenant")
    public ResponseEntity<List<DataExportRequestEntity>> getExportRequests() {
        String orgId = TenantContext.getOrgId();
        List<DataExportRequestEntity> requests = exportService.getExportRequestsByOrgId(orgId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get specific export request status")
    public ResponseEntity<DataExportRequestEntity> getExportRequest(@PathVariable Long id) {
        return exportService.getExportRequest(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/download/{id}")
    @Operation(summary = "Download exported data file")
    public ResponseEntity<Resource> downloadExport(@PathVariable Long id) {
        DataExportRequestEntity request = exportService.getExportRequest(id)
                .orElseThrow(() -> new IllegalArgumentException("Export request not found"));

        if (!"completed".equals(request.getStatus())) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build();
        }

        if (request.getDownloadUrlExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).build();
        }

        if (request.getDownloadCount() >= request.getMaxDownloads()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (!Files.exists(Paths.get(request.getExportFilePath()))) {
            return ResponseEntity.notFound().build();
        }

        exportService.incrementDownloadCount(id);

        Resource file = new FileSystemResource(request.getExportFilePath());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }
}
