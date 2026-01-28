package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/document-workflows")
public class DocumentWorkflowController {

    private final DocumentWorkflowService workflowService;
    private final DocumentVersionService versionService;
    private final DocumentWorkflowTemplateService templateService;

    public DocumentWorkflowController(
            DocumentWorkflowService workflowService,
            DocumentVersionService versionService,
            DocumentWorkflowTemplateService templateService) {
        this.workflowService = workflowService;
        this.versionService = versionService;
        this.templateService = templateService;
    }

    @PostMapping
    public ResponseEntity<DocumentWorkflowResponse> createWorkflow(
            @Valid @RequestBody DocumentWorkflowRequest request,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        DocumentWorkflowResponse response = workflowService.createWorkflow(request, orgId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{workflowId}/start")
    public ResponseEntity<DocumentWorkflowResponse> startWorkflow(
            @PathVariable Long workflowId,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        DocumentWorkflowResponse response = workflowService.startWorkflow(workflowId, orgId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{workflowId}")
    public ResponseEntity<DocumentWorkflowResponse> getWorkflow(
            @PathVariable Long workflowId,
            @RequestHeader("X-Org-Id") String orgId) {
        DocumentWorkflowResponse response = workflowService.getWorkflow(workflowId, orgId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<DocumentWorkflowResponse>> getWorkflowsByDocument(
            @PathVariable Long documentId,
            @RequestHeader("X-Org-Id") String orgId) {
        List<DocumentWorkflowResponse> workflows = workflowService.getWorkflowsByDocument(documentId, orgId);
        return ResponseEntity.ok(workflows);
    }

    @PostMapping("/approvals/{approvalId}")
    public ResponseEntity<Void> submitApproval(
            @PathVariable Long approvalId,
            @Valid @RequestBody WorkflowApprovalRequest request,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        workflowService.submitApproval(approvalId, request, orgId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/approvals/bulk")
    public ResponseEntity<Void> bulkApprove(
            @Valid @RequestBody BulkApprovalRequest request,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        workflowService.bulkApprove(request, orgId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/approvals/pending")
    public ResponseEntity<List<WorkflowApprovalEntity>> getPendingApprovals(
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        List<WorkflowApprovalEntity> approvals = workflowService.getPendingApprovals(userId, orgId);
        return ResponseEntity.ok(approvals);
    }

    @GetMapping("/documents/{documentId}/audit")
    public ResponseEntity<List<DocumentAuditEntity>> getDocumentAuditTrail(
            @PathVariable Long documentId,
            @RequestHeader("X-Org-Id") String orgId) {
        List<DocumentAuditEntity> auditTrail = workflowService.getDocumentAuditTrail(documentId, orgId);
        return ResponseEntity.ok(auditTrail);
    }

    @PostMapping("/documents/{documentId}/versions")
    public ResponseEntity<DocumentVersionEntity> createVersion(
            @PathVariable Long documentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "versionNotes", required = false) String versionNotes,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            DocumentVersionEntity version = versionService.createVersion(documentId, file, versionNotes, orgId, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(version);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/documents/{documentId}/versions")
    public ResponseEntity<List<DocumentVersionEntity>> getDocumentVersions(
            @PathVariable Long documentId,
            @RequestHeader("X-Org-Id") String orgId) {
        List<DocumentVersionEntity> versions = versionService.getVersions(documentId, orgId);
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/documents/{documentId}/versions/current")
    public ResponseEntity<DocumentVersionEntity> getCurrentVersion(
            @PathVariable Long documentId,
            @RequestHeader("X-Org-Id") String orgId) {
        DocumentVersionEntity version = versionService.getCurrentVersion(documentId, orgId);
        return ResponseEntity.ok(version);
    }

    @PostMapping("/documents/{documentId}/versions/{versionNumber}/restore")
    public ResponseEntity<Void> restoreVersion(
            @PathVariable Long documentId,
            @PathVariable Integer versionNumber,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        versionService.restoreVersion(documentId, versionNumber, orgId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/documents/versions/compare")
    public ResponseEntity<Map<String, Object>> compareVersions(
            @Valid @RequestBody DocumentVersionCompareRequest request,
            @RequestHeader("X-Org-Id") String orgId) {
        Map<String, Object> comparison = versionService.compareVersions(
                request.getDocumentId(),
                request.getFromVersion(),
                request.getToVersion(),
                orgId);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<WorkflowTemplateEntity>> getAllTemplates(
            @RequestHeader("X-Org-Id") String orgId) {
        List<WorkflowTemplateEntity> templates = templateService.getAllTemplates(orgId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates/popular")
    public ResponseEntity<List<WorkflowTemplateEntity>> getPopularTemplates(
            @RequestHeader("X-Org-Id") String orgId) {
        List<WorkflowTemplateEntity> templates = templateService.getPopularTemplates(orgId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<WorkflowTemplateEntity> getTemplate(
            @PathVariable Long templateId,
            @RequestHeader("X-Org-Id") String orgId) {
        WorkflowTemplateEntity template = templateService.getTemplate(templateId, orgId);
        return ResponseEntity.ok(template);
    }

    @PostMapping("/templates")
    public ResponseEntity<WorkflowTemplateEntity> createTemplate(
            @RequestBody WorkflowTemplateEntity template,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        WorkflowTemplateEntity created = templateService.createCustomTemplate(template, orgId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/templates/{templateId}")
    public ResponseEntity<WorkflowTemplateEntity> updateTemplate(
            @PathVariable Long templateId,
            @RequestBody WorkflowTemplateEntity template,
            @RequestHeader("X-Org-Id") String orgId) {
        WorkflowTemplateEntity updated = templateService.updateTemplate(templateId, template, orgId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long templateId,
            @RequestHeader("X-Org-Id") String orgId) {
        templateService.deleteTemplate(templateId, orgId);
        return ResponseEntity.noContent().build();
    }
}
