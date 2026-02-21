package com.example.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Type;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "custom_query")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class CustomQueryEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "sql_query", nullable = false, columnDefinition = "TEXT")
    private String sqlQuery;

    @Type(JsonType.class)
    @Column(name = "parameters", columnDefinition = "jsonb")
    private List<Map<String, Object>> parameters;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "execution_count")
    private Long executionCount = 0L;

    @Column(name = "avg_execution_time_ms")
    private Long avgExecutionTimeMs;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "approved_by", length = 255)
    private String approvedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSqlQuery() {
        return sqlQuery;
    }

    public void setSqlQuery(String sqlQuery) {
        this.sqlQuery = sqlQuery;
    }

    public List<Map<String, Object>> getParameters() {
        return parameters;
    }

    public void setParameters(List<Map<String, Object>> parameters) {
        this.parameters = parameters;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getExecutionCount() {
        return executionCount;
    }

    public void setExecutionCount(Long executionCount) {
        this.executionCount = executionCount;
    }

    public Long getAvgExecutionTimeMs() {
        return avgExecutionTimeMs;
    }

    public void setAvgExecutionTimeMs(Long avgExecutionTimeMs) {
        this.avgExecutionTimeMs = avgExecutionTimeMs;
    }

    public Boolean getIsApproved() {
        return isApproved;
    }

    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
}
