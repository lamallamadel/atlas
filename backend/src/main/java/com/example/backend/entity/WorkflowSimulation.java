package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "workflow_simulation")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowSimulation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "workflow_definition_id", nullable = false)
    private Long workflowDefinitionId;

    @Column(name = "simulation_name", nullable = false, length = 255)
    private String simulationName;

    @Column(name = "current_state", nullable = false, length = 50)
    private String currentState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "test_data_json", columnDefinition = "jsonb")
    private Map<String, Object> testDataJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "execution_log", columnDefinition = "jsonb")
    private List<Map<String, Object>> executionLog;

    @Column(name = "status", length = 50)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private Map<String, Object> resultJson;

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
}
