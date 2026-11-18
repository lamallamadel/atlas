package com.example.backend.brain;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

/**
 * Client du module vision du brain : lecture des photos (jamais de modification).
 *
 * <p>Distingue les trois issues possibles d'un appel, car elles ne se traitent pas pareil :
 * réussite, refus de l'entrée (inutile de réessayer telle quelle), indisponibilité (à réessayer
 * plus tard).
 */
@Component
public class BrainVisionClient {

    private static final Logger log = LoggerFactory.getLogger(BrainVisionClient.class);
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    public enum Outcome {
        OK,
        REJECTED,
        UNAVAILABLE
    }

    public record Result(Outcome outcome, Map<String, Object> body, String error) {
        static Result ok(Map<String, Object> body) {
            return new Result(Outcome.OK, body, null);
        }

        static Result failure(Outcome outcome, String error) {
            return new Result(outcome, null, error);
        }
    }

    private final BrainProperties properties;
    private final RestTemplate restTemplate;

    @Autowired
    public BrainVisionClient(BrainProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(
                Duration.ofSeconds(Math.max(10, properties.getVision().getTimeoutSeconds())));
        this.restTemplate = new RestTemplate(factory);
    }

    /** Pour les tests. */
    BrainVisionClient(BrainProperties properties, RestTemplate restTemplate) {
        this.properties = properties;
        this.restTemplate = restTemplate;
    }

    /**
     * Analyse une photo. Exactement une source : {@code imageUrl} (lien https) ou {@code
     * imageBase64}.
     */
    public Result analyzePhoto(
            String imageUrl, String imageBase64, String contentType, Map<String, Object> context) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("image_url", imageUrl);
        body.put("image_base64", imageBase64);
        body.put("content_type", contentType != null ? contentType : "image/jpeg");
        body.put("context", context);
        return post("/api/vision/analyze", body);
    }

    /** Profil agrégé, incohérences et description proposée. */
    public Result buildProfile(
            List<Map<String, Object>> analyses,
            Map<String, Object> declared,
            List<String> languages) {
        return post(
                "/api/vision/profile",
                Map.of("analyses", analyses, "declared", declared, "languages", languages));
    }

    private Result post(String path, Map<String, Object> body) {
        BrainProperties.ServiceConfig cfg = properties.getVision();
        if (cfg.getBaseUrl() == null || cfg.getBaseUrl().isBlank()) {
            return Result.failure(Outcome.UNAVAILABLE, "brain.vision.base-url non configuré");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set(API_KEY_HEADER, cfg.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            Map<String, Object> response =
                    restTemplate
                            .exchange(
                                    cfg.getBaseUrl() + path,
                                    HttpMethod.POST,
                                    new HttpEntity<>(body, headers),
                                    MAP_TYPE)
                            .getBody();
            return Result.ok(response != null ? response : Map.of());
        } catch (HttpStatusCodeException e) {
            HttpStatusCode status = e.getStatusCode();
            String detail = truncate(e.getResponseBodyAsString());
            log.warn("Brain vision {} -> HTTP {} : {}", path, status.value(), detail);
            if (status.value() == 400 || status.value() == 422) {
                return Result.failure(Outcome.REJECTED, detail);
            }
            return Result.failure(Outcome.UNAVAILABLE, "HTTP " + status.value() + " " + detail);
        } catch (Exception e) {
            log.warn("Brain vision {} injoignable : {}", path, e.getMessage());
            return Result.failure(Outcome.UNAVAILABLE, truncate(e.getMessage()));
        }
    }

    private static String truncate(String s) {
        if (s == null) {
            return null;
        }
        return s.length() > 450 ? s.substring(0, 450) : s;
    }
}
