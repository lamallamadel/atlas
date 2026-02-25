package com.example.backend.controller;

import com.example.backend.dto.LeadActivityLogRequest;
import com.example.backend.dto.LeadActivityResponse;
import com.example.backend.entity.LeadActivity;
import com.example.backend.service.LeadActivityService;
import jakarta.validation.Valid;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dossiers/{id}/activities")
public class LeadActivityController {

    private final LeadActivityService leadActivityService;

    public LeadActivityController(LeadActivityService leadActivityService) {
        this.leadActivityService = leadActivityService;
    }

    @PostMapping
    public ResponseEntity<LeadActivityResponse> logActivity(
            @PathVariable("id") Long dossierId,
            @Valid @RequestBody LeadActivityLogRequest request) {

        LeadActivity activity =
                leadActivityService.logActivity(
                        dossierId,
                        request.getActivityType(),
                        request.getDescription(),
                        request.getScoreImpact());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(activity));
    }

    @GetMapping
    public ResponseEntity<List<LeadActivityResponse>> getActivities(
            @PathVariable("id") Long dossierId) {
        List<LeadActivity> activities = leadActivityService.getActivitiesForDossier(dossierId);
        List<LeadActivityResponse> responses =
                activities.stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    private LeadActivityResponse toResponse(LeadActivity activity) {
        LeadActivityResponse response = new LeadActivityResponse();
        response.setId(activity.getId());
        response.setActivityType(activity.getActivityType());
        response.setDescription(activity.getDescription());
        response.setScoreImpact(activity.getScoreImpact());
        if (activity.getCreatedAt() != null) {
            response.setCreatedAt(activity.getCreatedAt().atZone(ZoneOffset.UTC).toInstant());
        }
        return response;
    }
}
