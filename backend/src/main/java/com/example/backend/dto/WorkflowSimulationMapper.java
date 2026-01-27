package com.example.backend.dto;

import com.example.backend.entity.WorkflowSimulation;
import org.springframework.stereotype.Component;

@Component
public class WorkflowSimulationMapper {

    public WorkflowSimulationResponse toResponse(WorkflowSimulation entity) {
        WorkflowSimulationResponse response = new WorkflowSimulationResponse();
        response.setId(entity.getId());
        response.setWorkflowDefinitionId(entity.getWorkflowDefinitionId());
        response.setSimulationName(entity.getSimulationName());
        response.setCurrentState(entity.getCurrentState());
        response.setTestDataJson(entity.getTestDataJson());
        response.setExecutionLog(entity.getExecutionLog());
        response.setStatus(entity.getStatus());
        response.setResultJson(entity.getResultJson());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    public WorkflowSimulation toEntity(WorkflowSimulationRequest request) {
        WorkflowSimulation entity = new WorkflowSimulation();
        entity.setWorkflowDefinitionId(request.getWorkflowDefinitionId());
        entity.setSimulationName(request.getSimulationName());
        entity.setCurrentState(request.getCurrentState());
        entity.setTestDataJson(request.getTestDataJson());
        return entity;
    }
}
