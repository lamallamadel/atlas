package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

@Schema(description = "Request for workflow simulation")
public class WorkflowSimulationRequest {

    @Schema(description = "Workflow definition ID", example = "1", required = true)
    @NotNull(message = "Workflow definition ID is required")
    private Long workflowDefinitionId;

    @Schema(description = "Simulation name", example = "Test lead qualification", required = true)
    @NotBlank(message = "Simulation name is required")
    private String simulationName;

    @Schema(description = "Initial state for simulation", example = "NEW", required = true)
    @NotBlank(message = "Current state is required")
    private String currentState;

    @Schema(description = "Test data JSON for simulation", required = true)
    @NotNull(message = "Test data is required")
    private Map<String, Object> testDataJson;

    public Long getWorkflowDefinitionId() {
        return workflowDefinitionId;
    }

    public void setWorkflowDefinitionId(Long workflowDefinitionId) {
        this.workflowDefinitionId = workflowDefinitionId;
    }

    public String getSimulationName() {
        return simulationName;
    }

    public void setSimulationName(String simulationName) {
        this.simulationName = simulationName;
    }

    public String getCurrentState() {
        return currentState;
    }

    public void setCurrentState(String currentState) {
        this.currentState = currentState;
    }

    public Map<String, Object> getTestDataJson() {
        return testDataJson;
    }

    public void setTestDataJson(Map<String, Object> testDataJson) {
        this.testDataJson = testDataJson;
    }
}
