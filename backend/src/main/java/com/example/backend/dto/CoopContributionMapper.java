package com.example.backend.dto;

import com.example.backend.entity.CoopContribution;
import org.springframework.stereotype.Component;

@Component
public class CoopContributionMapper {

    public CoopContribution toEntity(CoopContributionRequest request) {
        CoopContribution contribution = new CoopContribution();
        contribution.setType(request.getType());
        contribution.setAmount(request.getAmount());
        contribution.setCurrency(request.getCurrency());
        contribution.setStatus(request.getStatus());
        contribution.setDueDate(request.getDueDate());
        contribution.setPaymentDate(request.getPaymentDate());
        contribution.setReferenceNumber(request.getReferenceNumber());
        contribution.setDescription(request.getDescription());
        contribution.setMeta(request.getMeta());
        return contribution;
    }

    public void updateEntity(CoopContribution contribution, CoopContributionRequest request) {
        if (request.getType() != null) {
            contribution.setType(request.getType());
        }
        if (request.getAmount() != null) {
            contribution.setAmount(request.getAmount());
        }
        if (request.getCurrency() != null) {
            contribution.setCurrency(request.getCurrency());
        }
        if (request.getStatus() != null) {
            contribution.setStatus(request.getStatus());
        }
        if (request.getDueDate() != null) {
            contribution.setDueDate(request.getDueDate());
        }
        if (request.getPaymentDate() != null) {
            contribution.setPaymentDate(request.getPaymentDate());
        }
        if (request.getReferenceNumber() != null) {
            contribution.setReferenceNumber(request.getReferenceNumber());
        }
        if (request.getDescription() != null) {
            contribution.setDescription(request.getDescription());
        }
        if (request.getMeta() != null) {
            contribution.setMeta(request.getMeta());
        }
    }

    public CoopContributionResponse toResponse(CoopContribution contribution) {
        CoopContributionResponse response = new CoopContributionResponse();
        response.setId(contribution.getId());
        response.setMemberId(contribution.getMember() != null ? contribution.getMember().getId() : null);
        response.setProjectId(contribution.getProject() != null ? contribution.getProject().getId() : null);
        response.setType(contribution.getType());
        response.setAmount(contribution.getAmount());
        response.setCurrency(contribution.getCurrency());
        response.setStatus(contribution.getStatus());
        response.setDueDate(contribution.getDueDate());
        response.setPaymentDate(contribution.getPaymentDate());
        response.setReferenceNumber(contribution.getReferenceNumber());
        response.setDescription(contribution.getDescription());
        response.setMeta(contribution.getMeta());
        response.setCreatedAt(contribution.getCreatedAt());
        response.setUpdatedAt(contribution.getUpdatedAt());
        return response;
    }
}
