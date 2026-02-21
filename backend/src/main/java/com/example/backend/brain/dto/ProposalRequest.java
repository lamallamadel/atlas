package com.example.backend.brain.dto;

import java.util.List;
import java.util.Map;

public class ProposalRequest {
    private String clientName;
    private List<Map<String, Object>> biens;
    private String tonality = "professionnel";

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public List<Map<String, Object>> getBiens() {
        return biens;
    }

    public void setBiens(List<Map<String, Object>> biens) {
        this.biens = biens;
    }

    public String getTonality() {
        return tonality;
    }

    public void setTonality(String tonality) {
        this.tonality = tonality;
    }
}
