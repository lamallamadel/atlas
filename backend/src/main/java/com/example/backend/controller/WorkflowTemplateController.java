package com.example.backend.controller;

import com.example.backend.dto.WorkflowDefinitionResponse;
import com.example.backend.dto.WorkflowTemplateResponse;
import com.example.backend.service.WorkflowTemplateLibraryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow/templates")
@Tag(
        name = "Workflow Templates",
        description = "API for browsing and instantiating workflow templates")
public class WorkflowTemplateController {

    private final WorkflowTemplateLibraryService templateLibraryService;

    public WorkflowTemplateController(WorkflowTemplateLibraryService templateLibraryService) {
        this.templateLibraryService = templateLibraryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List workflow templates",
            description = "Retrieves available workflow templates")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Templates retrieved successfully")
            })
    public ResponseEntity<List<WorkflowTemplateResponse>> listTemplates(
            @Parameter(description = "Filter by category") @RequestParam(required = false)
                    String category) {
        List<WorkflowTemplateResponse> templates = templateLibraryService.listTemplates(category);
        return ResponseEntity.ok(templates);
    }

    @PostMapping("/{templateId}/instantiate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Instantiate template",
            description = "Creates a new workflow from a template")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "201", description = "Workflow created from template"),
                @ApiResponse(responseCode = "404", description = "Template not found")
            })
    public ResponseEntity<WorkflowDefinitionResponse> instantiateTemplate(
            @Parameter(description = "Template ID", required = true) @PathVariable Long templateId,
            @Parameter(description = "Custom name for the workflow") @RequestParam(required = false)
                    String name) {
        WorkflowDefinitionResponse workflow =
                templateLibraryService.instantiateTemplate(templateId, name);
        return ResponseEntity.status(HttpStatus.CREATED).body(workflow);
    }

    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Seed system templates", description = "Seeds predefined system templates")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Templates seeded successfully")
            })
    public ResponseEntity<Void> seedTemplates() {
        templateLibraryService.seedSystemTemplates();
        return ResponseEntity.ok().build();
    }
}
