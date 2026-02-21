package com.example.backend.brain.dto;

import java.util.List;
import java.util.Map;

public class MatchResponse {
    private List<Map<String, Object>> matches;

    public List<Map<String, Object>> getMatches() {
        return matches;
    }

    public void setMatches(List<Map<String, Object>> matches) {
        this.matches = matches;
    }
}
