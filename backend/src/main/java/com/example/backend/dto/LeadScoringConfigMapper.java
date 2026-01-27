package com.example.backend.dto;

import com.example.backend.entity.LeadScoringConfig;
import org.springframework.stereotype.Component;

@Component
public class LeadScoringConfigMapper {

    public LeadScoringConfigResponse toResponse(LeadScoringConfig entity) {
        LeadScoringConfigResponse response = new LeadScoringConfigResponse();
        response.setId(entity.getId());
        response.setConfigName(entity.getConfigName());
        response.setIsActive(entity.getIsActive());
        response.setAutoQualificationThreshold(entity.getAutoQualificationThreshold());
        response.setSourceWeights(entity.getSourceWeights());
        response.setEngagementWeights(entity.getEngagementWeights());
        response.setPropertyMatchWeights(entity.getPropertyMatchWeights());
        response.setResponseTimeWeight(entity.getResponseTimeWeight());
        response.setFastResponseMinutes(entity.getFastResponseMinutes());
        response.setMediumResponseMinutes(entity.getMediumResponseMinutes());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    public LeadScoringConfig toEntity(LeadScoringConfigRequest request) {
        LeadScoringConfig entity = new LeadScoringConfig();
        entity.setConfigName(request.getConfigName());
        entity.setIsActive(request.getIsActive());
        entity.setAutoQualificationThreshold(request.getAutoQualificationThreshold());
        entity.setSourceWeights(request.getSourceWeights());
        entity.setEngagementWeights(request.getEngagementWeights());
        entity.setPropertyMatchWeights(request.getPropertyMatchWeights());
        entity.setResponseTimeWeight(request.getResponseTimeWeight());
        entity.setFastResponseMinutes(request.getFastResponseMinutes());
        entity.setMediumResponseMinutes(request.getMediumResponseMinutes());
        return entity;
    }

    public void updateEntity(LeadScoringConfig entity, LeadScoringConfigRequest request) {
        if (request.getConfigName() != null) {
            entity.setConfigName(request.getConfigName());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getAutoQualificationThreshold() != null) {
            entity.setAutoQualificationThreshold(request.getAutoQualificationThreshold());
        }
        if (request.getSourceWeights() != null) {
            entity.setSourceWeights(request.getSourceWeights());
        }
        if (request.getEngagementWeights() != null) {
            entity.setEngagementWeights(request.getEngagementWeights());
        }
        if (request.getPropertyMatchWeights() != null) {
            entity.setPropertyMatchWeights(request.getPropertyMatchWeights());
        }
        if (request.getResponseTimeWeight() != null) {
            entity.setResponseTimeWeight(request.getResponseTimeWeight());
        }
        if (request.getFastResponseMinutes() != null) {
            entity.setFastResponseMinutes(request.getFastResponseMinutes());
        }
        if (request.getMediumResponseMinutes() != null) {
            entity.setMediumResponseMinutes(request.getMediumResponseMinutes());
        }
    }
}
