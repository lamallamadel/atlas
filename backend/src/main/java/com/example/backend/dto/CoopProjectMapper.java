package com.example.backend.dto;

import com.example.backend.entity.CoopProject;
import org.springframework.stereotype.Component;

@Component
public class CoopProjectMapper {

    public CoopProject toEntity(CoopProjectRequest request) {
        CoopProject project = new CoopProject();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setLocation(request.getLocation());
        project.setCity(request.getCity());
        project.setPostalCode(request.getPostalCode());
        project.setStatus(request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setExpectedCompletionDate(request.getExpectedCompletionDate());
        project.setCompletionDate(request.getCompletionDate());
        project.setTotalBudget(request.getTotalBudget());
        project.setCurrency(request.getCurrency());
        project.setMeta(request.getMeta());
        return project;
    }

    public void updateEntity(CoopProject project, CoopProjectRequest request) {
        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getLocation() != null) {
            project.setLocation(request.getLocation());
        }
        if (request.getCity() != null) {
            project.setCity(request.getCity());
        }
        if (request.getPostalCode() != null) {
            project.setPostalCode(request.getPostalCode());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getExpectedCompletionDate() != null) {
            project.setExpectedCompletionDate(request.getExpectedCompletionDate());
        }
        if (request.getCompletionDate() != null) {
            project.setCompletionDate(request.getCompletionDate());
        }
        if (request.getTotalBudget() != null) {
            project.setTotalBudget(request.getTotalBudget());
        }
        if (request.getCurrency() != null) {
            project.setCurrency(request.getCurrency());
        }
        if (request.getMeta() != null) {
            project.setMeta(request.getMeta());
        }
    }

    public CoopProjectResponse toResponse(CoopProject project) {
        CoopProjectResponse response = new CoopProjectResponse();
        response.setId(project.getId());
        response.setGroupId(project.getGroup() != null ? project.getGroup().getId() : null);
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setLocation(project.getLocation());
        response.setCity(project.getCity());
        response.setPostalCode(project.getPostalCode());
        response.setStatus(project.getStatus());
        response.setStartDate(project.getStartDate());
        response.setExpectedCompletionDate(project.getExpectedCompletionDate());
        response.setCompletionDate(project.getCompletionDate());
        response.setTotalBudget(project.getTotalBudget());
        response.setCurrency(project.getCurrency());
        response.setMeta(project.getMeta());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());
        return response;
    }
}
