package com.example.backend.controller;

import com.example.backend.dto.ClientErrorLogRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/observability")
public class ObservabilityController {

    private static final Logger logger = LoggerFactory.getLogger(ObservabilityController.class);

    @PostMapping("/client-errors")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> logClientError(
            @Valid @RequestBody ClientErrorLogRequest request) {

        String logMessage =
                String.format(
                        "Client %s - Message: %s, URL: %s, UserAgent: %s, Timestamp: %s",
                        request.level().toUpperCase(),
                        request.message(),
                        request.url(),
                        request.userAgent(),
                        request.timestamp());

        if (request.stackTrace() != null && !request.stackTrace().isEmpty()) {
            logMessage += ", StackTrace: " + request.stackTrace();
        }

        if (request.context() != null && !request.context().isEmpty()) {
            logMessage += ", Context: " + request.context();
        }

        if ("error".equalsIgnoreCase(request.level())) {
            logger.error(logMessage);
        } else if ("warning".equalsIgnoreCase(request.level())) {
            logger.warn(logMessage);
        } else {
            logger.info(logMessage);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("logged", true);
        response.put("timestamp", Instant.now().toString());
        response.put("level", request.level());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }
}
