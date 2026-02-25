package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Schema(description = "Workflow simulation response")
public class WorkflowSimulationResponse {

    @Schema(description = "Simulation ID", example = "1")
    private Long id;

    @Schema(description = "Workflow definition ID", example = "1")
    private Long workflowDefinitionId;

    @Schema(description = "Simulation name", example = "Test lead qualification")
    private String simulationName;

    @Schema(description = "Current state", example = "QUALIFIED")
    private String currentState;

    @Schema(description = "Test data used in simulation")
    private Map<String, Object> testDataJson;

    @Schema(description = "Execution log of the simulation")
    private List<Map<String, Object>> executionLog;

    @Schema(description = "Simulation status", example = "COMPLETED")
    private String status;

    @Schema(description = "Result of the simulation")
    private Map<String, Object> resultJson;

    @Schema(description = "Timestamp when created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public List<Map<String, Object>> getExecutionLog() {
        return executionLog;
    }

    public void setExecutionLog(List<Map<String, Object>> executionLog) {
        this.executionLog = executionLog;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getResultJson() {
        return resultJson;
    }

    public void setResultJson(Map<String, Object> resultJson) {
        this.resultJson = resultJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
