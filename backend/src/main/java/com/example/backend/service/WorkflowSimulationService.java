package com.example.backend.service;

import com.example.backend.dto.WorkflowSimulationMapper;
import com.example.backend.dto.WorkflowSimulationRequest;
import com.example.backend.dto.WorkflowSimulationResponse;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.WorkflowSimulation;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.repository.WorkflowSimulationRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class WorkflowSimulationService {

    private final WorkflowSimulationRepository simulationRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowSimulationMapper simulationMapper;

    public WorkflowSimulationService(
            WorkflowSimulationRepository simulationRepository,
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowSimulationMapper simulationMapper) {
        this.simulationRepository = simulationRepository;
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.simulationMapper = simulationMapper;
    }

    @Transactional
    public WorkflowSimulationResponse runSimulation(WorkflowSimulationRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition workflow = workflowDefinitionRepository.findById(request.getWorkflowDefinitionId())
                .orElseThrow(() -> new EntityNotFoundException("Workflow not found with id: " + request.getWorkflowDefinitionId()));

        if (!orgId.equals(workflow.getOrgId())) {
            throw new EntityNotFoundException("Workflow not found with id: " + request.getWorkflowDefinitionId());
        }

        WorkflowSimulation simulation = simulationMapper.toEntity(request);
        simulation.setOrgId(orgId);
        simulation.setStatus("RUNNING");

        List<Map<String, Object>> executionLog = new ArrayList<>();
        Map<String, Object> result = new HashMap<>();

        try {
            String currentState = request.getCurrentState();
            Map<String, Object> testData = request.getTestDataJson();

            executionLog.add(createLogEntry("START", "Simulation started", currentState, null, true, null));

            List<Map<String, Object>> transitions = workflow.getTransitionsJson();
            List<String> possibleTransitions = new ArrayList<>();

            for (Map<String, Object> transition : transitions) {
                String fromState = (String) transition.get("fromState");
                String toState = (String) transition.get("toState");

                if (fromState.equals(currentState)) {
                    boolean canTransition = validateTransition(transition, testData, executionLog);
                    if (canTransition) {
                        possibleTransitions.add(toState);
                    }
                }
            }

            result.put("currentState", currentState);
            result.put("possibleTransitions", possibleTransitions);
            result.put("totalTransitionsEvaluated", transitions.size());
            result.put("validTransitions", possibleTransitions.size());

            simulation.setCurrentState(currentState);
            simulation.setExecutionLog(executionLog);
            simulation.setResultJson(result);
            simulation.setStatus("COMPLETED");

            executionLog.add(createLogEntry("END", "Simulation completed successfully", currentState, null, true, null));

        } catch (Exception e) {
            simulation.setStatus("FAILED");
            result.put("error", e.getMessage());
            executionLog.add(createLogEntry("ERROR", "Simulation failed: " + e.getMessage(), null, null, false, e.getMessage()));
        }

        simulation.setCreatedAt(LocalDateTime.now());
        simulation.setUpdatedAt(LocalDateTime.now());

        WorkflowSimulation saved = simulationRepository.save(simulation);
        return simulationMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkflowSimulationResponse> getSimulationHistory(Long workflowDefinitionId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        List<WorkflowSimulation> simulations = simulationRepository
                .findByWorkflowDefinitionId(workflowDefinitionId, orgId);

        return simulations.stream()
                .map(simulationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkflowSimulationResponse getSimulationById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowSimulation simulation = simulationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Simulation not found with id: " + id));

        if (!orgId.equals(simulation.getOrgId())) {
            throw new EntityNotFoundException("Simulation not found with id: " + id);
        }

        return simulationMapper.toResponse(simulation);
    }

    private boolean validateTransition(Map<String, Object> transition, Map<String, Object> testData, List<Map<String, Object>> log) {
        String fromState = (String) transition.get("fromState");
        String toState = (String) transition.get("toState");
        String label = (String) transition.get("label");

        @SuppressWarnings("unchecked")
        List<String> requiredFields = (List<String>) transition.get("requiredFields");

        if (requiredFields != null && !requiredFields.isEmpty()) {
            List<String> missingFields = new ArrayList<>();
            for (String field : requiredFields) {
                if (!testData.containsKey(field) || testData.get(field) == null) {
                    missingFields.add(field);
                }
            }

            if (!missingFields.isEmpty()) {
                log.add(createLogEntry("VALIDATION_FAILED",
                        "Transition '" + label + "' failed validation",
                        fromState, toState, false,
                        "Missing required fields: " + String.join(", ", missingFields)));
                return false;
            }
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> conditions = (Map<String, Object>) transition.get("conditionsJson");
        if (conditions != null && !conditions.isEmpty()) {
            boolean conditionsMet = evaluateConditions(conditions, testData);
            if (!conditionsMet) {
                log.add(createLogEntry("CONDITION_FAILED",
                        "Transition '" + label + "' conditions not met",
                        fromState, toState, false,
                        "Business conditions not satisfied"));
                return false;
            }
        }

        log.add(createLogEntry("VALIDATION_SUCCESS",
                "Transition '" + label + "' validation passed",
                fromState, toState, true, null));
        return true;
    }

    private boolean evaluateConditions(Map<String, Object> conditions, Map<String, Object> testData) {
        return true;
    }

    private Map<String, Object> createLogEntry(String eventType, String message, String fromState, String toState, boolean success, String error) {
        Map<String, Object> logEntry = new HashMap<>();
        logEntry.put("timestamp", LocalDateTime.now().toString());
        logEntry.put("eventType", eventType);
        logEntry.put("message", message);
        logEntry.put("fromState", fromState);
        logEntry.put("toState", toState);
        logEntry.put("success", success);
        if (error != null) {
            logEntry.put("error", error);
        }
        return logEntry;
    }
}
