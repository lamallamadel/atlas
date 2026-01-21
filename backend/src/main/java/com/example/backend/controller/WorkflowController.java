package com.example.backend.controller;

import com.example.backend.dto.WorkflowDefinitionRequest;
import com.example.backend.dto.WorkflowDefinitionResponse;
import com.example.backend.dto.WorkflowTransitionResponse;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.WorkflowService;
import com.example.backend.service.WorkflowValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow")
@Tag(name = "Workflow", description = "API for managing workflow definitions and transitions")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final WorkflowValidationService workflowValidationService;

    public WorkflowController(WorkflowService workflowService, WorkflowValidationService workflowValidationService) {
        this.workflowService = workflowService;
        this.workflowValidationService = workflowValidationService;
    }

    @PostMapping("/definitions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create workflow definition", description = "Creates a new workflow definition (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Workflow definition created successfully",
                    content = @Content(schema = @Schema(implementation = WorkflowDefinitionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required",
                    content = @Content)
    })
    public ResponseEntity<WorkflowDefinitionResponse> createDefinition(
            @Valid @RequestBody WorkflowDefinitionRequest request) {
        WorkflowDefinitionResponse response = workflowService.createDefinition(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/definitions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get workflow definition by ID", description = "Retrieves a workflow definition by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow definition found",
                    content = @Content(schema = @Schema(implementation = WorkflowDefinitionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Workflow definition not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<WorkflowDefinitionResponse> getDefinitionById(
            @Parameter(description = "ID of the workflow definition", required = true)
            @PathVariable Long id) {
        WorkflowDefinitionResponse response = workflowService.getDefinitionById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/definitions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "List workflow definitions",
        description = "Retrieves a paginated list of workflow definitions with optional filtering"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow definitions retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<WorkflowDefinitionResponse>> listDefinitions(
            @Parameter(description = "Filter by case type")
            @RequestParam(required = false) String caseType,
            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (min=1, default=20)")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc)")
            @RequestParam(defaultValue = "id,asc") String sort) {

        if (page < 0) {
            throw new IllegalArgumentException("Page number must be at least 0");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be at least 1");
        }

        Pageable pageable = createPageable(page, size, sort);
        Page<WorkflowDefinitionResponse> response = workflowService.listDefinitions(caseType, isActive, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/definitions/case-type/{caseType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "Get transitions for case type",
        description = "Retrieves all active workflow definitions for a specific case type"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow definitions retrieved successfully")
    })
    public ResponseEntity<List<WorkflowDefinitionResponse>> getTransitionsForCaseType(
            @Parameter(description = "Case type code", required = true)
            @PathVariable String caseType) {
        List<WorkflowDefinitionResponse> response = workflowService.getTransitionsForCaseType(caseType);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/definitions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update workflow definition", description = "Updates an existing workflow definition (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow definition updated successfully",
                    content = @Content(schema = @Schema(implementation = WorkflowDefinitionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Workflow definition not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required",
                    content = @Content)
    })
    public ResponseEntity<WorkflowDefinitionResponse> updateDefinition(
            @Parameter(description = "ID of the workflow definition", required = true)
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDefinitionRequest request) {
        WorkflowDefinitionResponse response = workflowService.updateDefinition(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/definitions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete workflow definition", description = "Deletes a workflow definition (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Workflow definition deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Workflow definition not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required",
                    content = @Content)
    })
    public ResponseEntity<Void> deleteDefinition(
            @Parameter(description = "ID of the workflow definition", required = true)
            @PathVariable Long id) {
        workflowService.deleteDefinition(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/transitions/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "Get transition history for dossier",
        description = "Retrieves workflow transition history for a specific dossier"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transition history retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<WorkflowTransitionResponse>> getTransitionHistory(
            @Parameter(description = "Dossier ID", required = true)
            @PathVariable Long dossierId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (min=1, default=20)")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc)")
            @RequestParam(defaultValue = "transitionedAt,desc") String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<WorkflowTransitionResponse> response = workflowService.getTransitionHistory(dossierId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/allowed-transitions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "Get allowed next statuses",
        description = "Retrieves allowed next statuses for a given case type and current status"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Allowed transitions retrieved successfully")
    })
    public ResponseEntity<List<String>> getAllowedNextStatuses(
            @Parameter(description = "Case type code", required = true)
            @RequestParam String caseType,
            @Parameter(description = "Current status", required = true)
            @RequestParam String currentStatus) {
        List<String> allowedStatuses = workflowValidationService.getAllowedNextStatuses(caseType, currentStatus);
        return ResponseEntity.ok(allowedStatuses);
    }

    @GetMapping("/validate-transition/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "Validate transition before attempting",
        description = "Checks if a status transition would be valid without actually performing it. " +
                "Returns validation results including any errors, missing required fields, role issues, " +
                "or pre-conditions that need to be satisfied."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Validation check completed successfully. " +
                    "Check the 'isValid' field in response to determine if transition is allowed.")
    })
    public ResponseEntity<java.util.Map<String, Object>> validateTransition(
            @Parameter(description = "Dossier ID", required = true)
            @PathVariable Long dossierId,
            @Parameter(description = "Source status", required = true)
            @RequestParam String fromStatus,
            @Parameter(description = "Target status", required = true)
            @RequestParam String toStatus) {
        java.util.Map<String, Object> validationResult = workflowService.validateTransition(dossierId, fromStatus, toStatus);
        return ResponseEntity.ok(validationResult);
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
