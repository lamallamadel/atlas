package com.example.backend.controller;

import com.example.backend.entity.TenantOnboardingEntity;
import com.example.backend.repository.TenantOnboardingRepository;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/onboarding")
@Tag(name = "Tenant Onboarding", description = "Onboarding wizard and progress tracking")
public class TenantOnboardingController {

    private final TenantOnboardingRepository onboardingRepository;

    public TenantOnboardingController(TenantOnboardingRepository onboardingRepository) {
        this.onboardingRepository = onboardingRepository;
    }

    @GetMapping("/progress")
    @Operation(summary = "Get onboarding progress for current user")
    public ResponseEntity<TenantOnboardingEntity> getProgress(Authentication authentication) {
        String orgId = TenantContext.getOrgId();
        String userId = authentication.getName();

        TenantOnboardingEntity onboarding =
                onboardingRepository
                        .findByOrgIdAndUserId(orgId, userId)
                        .orElseGet(() -> createOnboarding(orgId, userId));

        return ResponseEntity.ok(onboarding);
    }

    @PostMapping("/step/{stepName}/complete")
    @Operation(summary = "Mark onboarding step as completed")
    public ResponseEntity<TenantOnboardingEntity> completeStep(
            @PathVariable String stepName, Authentication authentication) {

        String orgId = TenantContext.getOrgId();
        String userId = authentication.getName();

        TenantOnboardingEntity onboarding =
                onboardingRepository
                        .findByOrgIdAndUserId(orgId, userId)
                        .orElseGet(() -> createOnboarding(orgId, userId));

        markStepComplete(onboarding, stepName);
        updateProgress(onboarding);

        TenantOnboardingEntity updated = onboardingRepository.save(onboarding);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/skip")
    @Operation(summary = "Skip onboarding wizard")
    public ResponseEntity<TenantOnboardingEntity> skipOnboarding(Authentication authentication) {
        String orgId = TenantContext.getOrgId();
        String userId = authentication.getName();

        TenantOnboardingEntity onboarding =
                onboardingRepository
                        .findByOrgIdAndUserId(orgId, userId)
                        .orElseGet(() -> createOnboarding(orgId, userId));

        onboarding.setProgressPercent(100);
        onboarding.setOnboardingCompletedAt(LocalDateTime.now());
        TenantOnboardingEntity updated = onboardingRepository.save(onboarding);

        return ResponseEntity.ok(updated);
    }

    private TenantOnboardingEntity createOnboarding(String orgId, String userId) {
        TenantOnboardingEntity onboarding = new TenantOnboardingEntity();
        onboarding.setOrgId(orgId);
        onboarding.setUserId(userId);
        onboarding.setCompletedSteps(new HashMap<>());
        onboarding.setDismissedTooltips(new HashMap<>());
        onboarding.setWatchedTutorials(new HashMap<>());
        onboarding.setCurrentStep("welcome");
        return onboardingRepository.save(onboarding);
    }

    private void markStepComplete(TenantOnboardingEntity onboarding, String stepName) {
        switch (stepName) {
            case "profile":
                onboarding.setProfileCompleted(true);
                break;
            case "branding":
                onboarding.setBrandingConfigured(true);
                break;
            case "first_dossier":
                onboarding.setFirstDossierCreated(true);
                break;
            case "team_member":
                onboarding.setTeamMemberInvited(true);
                break;
            case "integration":
                onboarding.setIntegrationConfigured(true);
                break;
            case "workflow":
                onboarding.setWorkflowConfigured(true);
                break;
        }

        Map<String, Object> completedSteps = onboarding.getCompletedSteps();
        if (completedSteps == null) {
            completedSteps = new HashMap<>();
        }
        completedSteps.put(stepName, LocalDateTime.now().toString());
        onboarding.setCompletedSteps(completedSteps);
    }

    private void updateProgress(TenantOnboardingEntity onboarding) {
        int completed = 0;
        if (onboarding.getProfileCompleted()) completed++;
        if (onboarding.getBrandingConfigured()) completed++;
        if (onboarding.getFirstDossierCreated()) completed++;
        if (onboarding.getTeamMemberInvited()) completed++;
        if (onboarding.getIntegrationConfigured()) completed++;
        if (onboarding.getWorkflowConfigured()) completed++;

        int progress = (completed * 100) / onboarding.getTotalSteps();
        onboarding.setProgressPercent(progress);

        if (progress == 100 && onboarding.getOnboardingCompletedAt() == null) {
            onboarding.setOnboardingCompletedAt(LocalDateTime.now());
        }
    }
}
