package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WorkflowSettingsDto {

    @NotNull(message = "Enabled features list is required")
    private List<String> enabledFeatures;

    @NotNull(message = "Default case types list is required")
    private List<String> defaultCaseTypes;

    @NotNull(message = "Status transition rules are required")
    private Map<String, List<String>> statusTransitionRules;

    public WorkflowSettingsDto() {
        this.enabledFeatures = new ArrayList<>();
        this.defaultCaseTypes = new ArrayList<>();
        this.statusTransitionRules = new HashMap<>();
    }

    public WorkflowSettingsDto(
            List<String> enabledFeatures,
            List<String> defaultCaseTypes,
            Map<String, List<String>> statusTransitionRules) {
        this.enabledFeatures = enabledFeatures != null ? enabledFeatures : new ArrayList<>();
        this.defaultCaseTypes = defaultCaseTypes != null ? defaultCaseTypes : new ArrayList<>();
        this.statusTransitionRules =
                statusTransitionRules != null ? statusTransitionRules : new HashMap<>();
    }

    public List<String> getEnabledFeatures() {
        return enabledFeatures;
    }

    public void setEnabledFeatures(List<String> enabledFeatures) {
        this.enabledFeatures = enabledFeatures;
    }

    public List<String> getDefaultCaseTypes() {
        return defaultCaseTypes;
    }

    public void setDefaultCaseTypes(List<String> defaultCaseTypes) {
        this.defaultCaseTypes = defaultCaseTypes;
    }

    public Map<String, List<String>> getStatusTransitionRules() {
        return statusTransitionRules;
    }

    public void setStatusTransitionRules(Map<String, List<String>> statusTransitionRules) {
        this.statusTransitionRules = statusTransitionRules;
    }
}
