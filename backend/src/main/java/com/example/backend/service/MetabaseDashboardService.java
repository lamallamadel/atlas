package com.example.backend.service;

import com.example.backend.dto.MetabaseEmbedRequest;
import com.example.backend.dto.MetabaseEmbedResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class MetabaseDashboardService {

    private static final Logger logger = LoggerFactory.getLogger(MetabaseDashboardService.class);

    @Value("${metabase.url:http://localhost:3000}")
    private String metabaseUrl;

    @Value("${metabase.secret-key:your-secret-key-here}")
    private String metabaseSecretKey;

    @Value("${metabase.site-url:http://localhost:4200}")
    private String siteUrl;

    private final WebClient webClient;

    public MetabaseDashboardService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public MetabaseEmbedResponse generateEmbedUrl(MetabaseEmbedRequest request) {
        String dashboardId = request.getDashboardId();
        Map<String, Object> params =
                request.getParams() != null ? request.getParams() : new HashMap<>();
        Long expirationMinutes =
                request.getExpirationMinutes() != null ? request.getExpirationMinutes() : 10L;

        Instant expiration = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);

        Map<String, Object> payload = new HashMap<>();
        payload.put("resource", Map.of("dashboard", Integer.parseInt(dashboardId)));
        payload.put("params", params);
        payload.put("exp", expiration.getEpochSecond());

        String token = generateJwtToken(payload, expiration);
        String embedUrl =
                String.format(
                        "%s/embed/dashboard/%s#bordered=false&titled=false", metabaseUrl, token);

        logger.info("Generated Metabase embed URL for dashboard: {}", dashboardId);

        return new MetabaseEmbedResponse(embedUrl, token, expiration.getEpochSecond());
    }

    public MetabaseEmbedResponse generateQuestionEmbedUrl(
            String questionId, Map<String, Object> params, Long expirationMinutes) {
        if (expirationMinutes == null) {
            expirationMinutes = 10L;
        }

        Instant expiration = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);

        Map<String, Object> payload = new HashMap<>();
        payload.put("resource", Map.of("question", Integer.parseInt(questionId)));
        payload.put("params", params != null ? params : new HashMap<>());
        payload.put("exp", expiration.getEpochSecond());

        String token = generateJwtToken(payload, expiration);
        String embedUrl =
                String.format(
                        "%s/embed/question/%s#bordered=false&titled=false", metabaseUrl, token);

        logger.info("Generated Metabase embed URL for question: {}", questionId);

        return new MetabaseEmbedResponse(embedUrl, token, expiration.getEpochSecond());
    }

    public String authenticateWithSSO(String userId, String email, String orgId) {
        Instant expiration = Instant.now().plus(60, ChronoUnit.MINUTES);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("user_id", userId);
        claims.put("org_id", orgId);
        claims.put("exp", expiration.getEpochSecond());

        return generateJwtToken(claims, expiration);
    }

    public void createDashboard(
            String dashboardName, String description, Map<String, Object> metadata) {
        try {
            Map<String, Object> dashboardRequest = new HashMap<>();
            dashboardRequest.put("name", dashboardName);
            dashboardRequest.put("description", description);

            webClient
                    .post()
                    .uri(metabaseUrl + "/api/dashboard")
                    .bodyValue(dashboardRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .doOnSuccess(
                            response ->
                                    logger.info(
                                            "Dashboard created successfully: {}",
                                            response.get("id")))
                    .doOnError(
                            error ->
                                    logger.error(
                                            "Failed to create dashboard: {}", error.getMessage()))
                    .subscribe();

        } catch (Exception e) {
            logger.error("Error creating Metabase dashboard", e);
            throw new RuntimeException("Failed to create dashboard", e);
        }
    }

    private String generateJwtToken(Map<String, Object> claims, Instant expiration) {
        SecretKey key = Keys.hmacShaKeyFor(metabaseSecretKey.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setClaims(claims)
                .setExpiration(Date.from(expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
