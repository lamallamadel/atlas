package com.example.backend.brain;

import com.example.backend.brain.dto.BienScoreRequest;
import com.example.backend.brain.dto.BienScoreResponse;
import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.brain.dto.FraudRequest;
import com.example.backend.brain.dto.FraudResponse;
import com.example.backend.brain.dto.MatchRequest;
import com.example.backend.brain.dto.MatchResponse;
import com.example.backend.brain.dto.ProposalRequest;
import com.example.backend.brain.dto.ProposalResponse;
import com.example.backend.brain.dto.NegoRequest;
import com.example.backend.brain.dto.NegoResponse;
import com.example.backend.brain.dto.AgentBrainRequest;
import com.example.backend.brain.dto.AgentBrainResponse;
import com.example.backend.brain.dto.DocumentVerifyRequest;
import com.example.backend.brain.dto.DocumentVerifyResponse;
import com.example.backend.brain.dto.ContractGenerateRequest;
import com.example.backend.brain.dto.ContractGenerateResponse;
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

            ResponseEntity<BienScoreResponse> response = restTemplate.postForEntity(
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

            ResponseEntity<DoublonResultDto[]> response = restTemplate.postForEntity(
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

            ResponseEntity<FraudResponse> response = restTemplate.postForEntity(
                    properties.getFraud().getBaseUrl() + "/api/fraud/analyser",
                    new HttpEntity<>(request, headers),
                    FraudResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Fraud service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<MatchResponse> calculateMatch(MatchRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getMatch().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<MatchResponse> response = restTemplate.postForEntity(
                    properties.getMatch().getBaseUrl() + "/api/match/calculer",
                    new HttpEntity<>(request, headers),
                    MatchResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Match service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<ProposalResponse> generateProposal(ProposalRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getProposal().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<ProposalResponse> response = restTemplate.postForEntity(
                    properties.getProposal().getBaseUrl() + "/api/proposal/generer",
                    new HttpEntity<>(request, headers),
                    ProposalResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Proposal service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<NegoResponse> analyzeNego(NegoRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getNego().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<NegoResponse> response = restTemplate.postForEntity(
                    properties.getNego().getBaseUrl() + "/api/nego/analyser",
                    new HttpEntity<>(request, headers),
                    NegoResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Nego service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<AgentBrainResponse> processAgentQuery(AgentBrainRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getAgent().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<AgentBrainResponse> response = restTemplate.postForEntity(
                    properties.getAgent().getBaseUrl() + "/api/agent/process",
                    new HttpEntity<>(request, headers),
                    AgentBrainResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Agent service unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<DocumentVerifyResponse> verifyDocument(DocumentVerifyRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getDocument().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<DocumentVerifyResponse> response = restTemplate.postForEntity(
                    properties.getDocument().getBaseUrl() + "/api/document/verify",
                    new HttpEntity<>(request, headers),
                    DocumentVerifyResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Document service unavailable (verify): {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<ContractGenerateResponse> generateContract(ContractGenerateRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(API_KEY_HEADER, properties.getDocument().getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<ContractGenerateResponse> response = restTemplate.postForEntity(
                    properties.getDocument().getBaseUrl() + "/api/document/generate-contract",
                    new HttpEntity<>(request, headers),
                    ContractGenerateResponse.class);
            return Optional.ofNullable(response.getBody());
        } catch (Exception e) {
            log.warn("Document service unavailable (generate): {}", e.getMessage());
            return Optional.empty();
        }
    }
}
