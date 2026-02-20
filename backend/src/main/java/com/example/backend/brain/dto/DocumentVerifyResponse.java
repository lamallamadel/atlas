package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class DocumentVerifyResponse {
    @JsonProperty("is_valid")
    private boolean isValid;

    private double confidence;
    private String analysis;
    private List<String> flags;

    public boolean isValid() {
        return isValid;
    }

    public void setValid(boolean isValid) {
        this.isValid = isValid;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public List<String> getFlags() {
        return flags;
    }

    public void setFlags(List<String> flags) {
        this.flags = flags;
    }
}
