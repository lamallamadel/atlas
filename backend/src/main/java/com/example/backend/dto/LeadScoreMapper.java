package com.example.backend.dto;

import com.example.backend.entity.LeadScore;
import org.springframework.stereotype.Component;

@Component
public class LeadScoreMapper {

    public LeadScoreResponse toResponse(LeadScore entity) {
        LeadScoreResponse response = new LeadScoreResponse();
        response.setId(entity.getId());
        response.setDossierId(entity.getDossierId());
        response.setTotalScore(entity.getTotalScore());
        response.setSourceScore(entity.getSourceScore());
        response.setResponseTimeScore(entity.getResponseTimeScore());
        response.setEngagementScore(entity.getEngagementScore());
        response.setPropertyMatchScore(entity.getPropertyMatchScore());
        response.setScoreBreakdown(entity.getScoreBreakdown());
        response.setLastCalculatedAt(entity.getLastCalculatedAt());
        return response;
    }
}
