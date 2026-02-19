package com.example.backend.brain;

import com.example.backend.brain.dto.BienScoreRequest;
import com.example.backend.brain.dto.BienScoreResponse;
import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.brain.dto.FraudRequest;
import com.example.backend.brain.dto.FraudResponse;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Profile("!test & !backend-e2e")
public class BrainClientService {

    private static final Logger log = LoggerFactory.getLogger(BrainClientService.class);
    private static final String API_KEY_HEADER = "X-API-Key";

    private final RestTemplate restTemplate;
    private final BrainProperties properties;

    public BrainClientService(
            @Qualifier("brainRestTemplate") RestTemplate restTemplate, BrainProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public Optional<BienScoreResponse> scoreAnnonce(BienScoreRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getScoring().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<BienScoreResponse> response =
                    restTemplate.postForEntity(
                            properties.getScoring().getBaseUrl() + "/api/scoring/bien",
                            new HttpEntity<>(request, headers),
                            BienScoreResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Scoring service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public List<DoublonResultDto> detectDuplicates(List<DupliAnnonceDto> annonces) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getDupli().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<DoublonResultDto[]> response =
                    restTemplate.postForEntity(
                            properties.getDupli().getBaseUrl() + "/api/dupli/verifier",
                            new HttpEntity<>(annonces, headers),
                            DoublonResultDto[].class);
            return response.getBody() != null ? Arrays.asList(response.getBody()) : List.of();
        } catch (Exception e) {
            log.warn("Dupli service unavailable: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<FraudResponse> analyzeFraud(FraudRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getFraud().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<FraudResponse> response =
                    restTemplate.postForEntity(
                            properties.getFraud().getBaseUrl() + "/api/fraud/analyser",
                            new HttpEntity<>(request, headers),
                            FraudResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Fraud service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
