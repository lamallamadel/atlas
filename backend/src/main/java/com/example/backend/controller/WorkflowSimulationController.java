package com.example.backend.controller;

import com.example.backend.dto.WorkflowSimulationRequest;
import com.example.backend.dto.WorkflowSimulationResponse;
import com.example.backend.service.WorkflowSimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow/simulations")
@Tag(name = "Workflow Simulations", description = "API for testing workflows before activation")
public class WorkflowSimulationController {

    private final WorkflowSimulationService simulationService;

    public WorkflowSimulationController(WorkflowSimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Run workflow simulation",
            description = "Simulates workflow execution with test data")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Simulation executed successfully"),
                @ApiResponse(responseCode = "404", description = "Workflow not found")
            })
    public ResponseEntity<WorkflowSimulationResponse> runSimulation(
            @Valid @RequestBody WorkflowSimulationRequest request) {
        WorkflowSimulationResponse response = simulationService.runSimulation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get simulation by ID",
            description = "Retrieves a specific simulation result")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Simulation found"),
                @ApiResponse(responseCode = "404", description = "Simulation not found")
            })
    public ResponseEntity<WorkflowSimulationResponse> getSimulationById(
            @Parameter(description = "Simulation ID", required = true) @PathVariable Long id) {
        WorkflowSimulationResponse response = simulationService.getSimulationById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/workflow/{workflowDefinitionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get simulation history",
            description = "Retrieves simulation history for a workflow")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Simulation history retrieved")
            })
    public ResponseEntity<List<WorkflowSimulationResponse>> getSimulationHistory(
            @Parameter(description = "Workflow definition ID", required = true) @PathVariable
                    Long workflowDefinitionId) {
        List<WorkflowSimulationResponse> history =
                simulationService.getSimulationHistory(workflowDefinitionId);
        return ResponseEntity.ok(history);
    }
}
