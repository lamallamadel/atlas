package com.example.backend.controller;

import com.example.backend.dto.ClientErrorLogRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ObservabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void testLogClientError() throws Exception {
        Map<String, Object> context = new HashMap<>();
        context.put("severity", "critical");
        context.put("component", "DossierService");

        ClientErrorLogRequest request = new ClientErrorLogRequest(
            "Failed to load dossier data",
            "error",
            Instant.now().toString(),
            "Mozilla/5.0",
            "http://localhost:4200/dossiers",
            "Error: Network timeout at line 42",
            context
        );

        mockMvc.perform(post("/api/v1/observability/client-errors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.logged").value(true))
            .andExpect(jsonPath("$.level").value("error"))
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    void testLogClientWarning() throws Exception {
        ClientErrorLogRequest request = new ClientErrorLogRequest(
            "High memory usage detected",
            "warning",
            Instant.now().toString(),
            "Mozilla/5.0",
            "http://localhost:4200/dashboard",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/observability/client-errors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.logged").value(true))
            .andExpect(jsonPath("$.level").value("warning"));
    }

    @Test
    void testLogClientErrorUnauthorized() throws Exception {
        ClientErrorLogRequest request = new ClientErrorLogRequest(
            "Test error",
            "error",
            Instant.now().toString(),
            "Mozilla/5.0",
            "http://localhost:4200",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/observability/client-errors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void testLogClientErrorWithInvalidLevel() throws Exception {
        ClientErrorLogRequest request = new ClientErrorLogRequest(
            "Test error",
            "invalid",
            Instant.now().toString(),
            "Mozilla/5.0",
            "http://localhost:4200",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/observability/client-errors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/v1/observability/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.timestamp").exists());
    }
}
