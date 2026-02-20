package com.example.backend.brain;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "brain")
public class BrainProperties {

    private ServiceConfig scoring = new ServiceConfig();
    private ServiceConfig dupli = new ServiceConfig();
    private ServiceConfig fraud = new ServiceConfig();
    private ServiceConfig match = new ServiceConfig();
    private ServiceConfig proposal = new ServiceConfig();
    private ServiceConfig nego = new ServiceConfig();
    private ServiceConfig agent = new ServiceConfig();

    public ServiceConfig getScoring() {
        return scoring;
    }

    public void setScoring(ServiceConfig scoring) {
        this.scoring = scoring;
    }

    public ServiceConfig getDupli() {
        return dupli;
    }

    public void setDupli(ServiceConfig dupli) {
        this.dupli = dupli;
    }

    public ServiceConfig getFraud() {
        return fraud;
    }

    public void setFraud(ServiceConfig fraud) {
        this.fraud = fraud;
    }

    public ServiceConfig getMatch() {
        return match;
    }

    public void setMatch(ServiceConfig match) {
        this.match = match;
    }

    public ServiceConfig getProposal() {
        return proposal;
    }

    public void setProposal(ServiceConfig proposal) {
        this.proposal = proposal;
    }

    public ServiceConfig getNego() {
        return nego;
    }

    public void setNego(ServiceConfig nego) {
        this.nego = nego;
    }

    public ServiceConfig getAgent() {
        return agent;
    }

    public void setAgent(ServiceConfig agent) {
        this.agent = agent;
    }

    public static class ServiceConfig {
        private String baseUrl;
        private String apiKey;
        private int timeoutSeconds = 5;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public int getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(int timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }
    }
}
