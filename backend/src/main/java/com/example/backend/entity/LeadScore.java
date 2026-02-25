package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "lead_score")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class LeadScore extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore = 0;

    @Column(name = "source_score")
    private Integer sourceScore = 0;

    @Column(name = "response_time_score")
    private Integer responseTimeScore = 0;

    @Column(name = "engagement_score")
    private Integer engagementScore = 0;

    @Column(name = "property_match_score")
    private Integer propertyMatchScore = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "score_breakdown", columnDefinition = "jsonb")
    private Map<String, Object> scoreBreakdown = new HashMap<>();

    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Integer getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getSourceScore() {
        return sourceScore;
    }

    public void setSourceScore(Integer sourceScore) {
        this.sourceScore = sourceScore;
    }

    public Integer getResponseTimeScore() {
        return responseTimeScore;
    }

    public void setResponseTimeScore(Integer responseTimeScore) {
        this.responseTimeScore = responseTimeScore;
    }

    public Integer getEngagementScore() {
        return engagementScore;
    }

    public void setEngagementScore(Integer engagementScore) {
        this.engagementScore = engagementScore;
    }

    public Integer getPropertyMatchScore() {
        return propertyMatchScore;
    }

    public void setPropertyMatchScore(Integer propertyMatchScore) {
        this.propertyMatchScore = propertyMatchScore;
    }

    public Map<String, Object> getScoreBreakdown() {
        return scoreBreakdown;
    }

    public void setScoreBreakdown(Map<String, Object> scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }

    public LocalDateTime getLastCalculatedAt() {
        return lastCalculatedAt;
    }

    public void setLastCalculatedAt(LocalDateTime lastCalculatedAt) {
        this.lastCalculatedAt = lastCalculatedAt;
    }
}
