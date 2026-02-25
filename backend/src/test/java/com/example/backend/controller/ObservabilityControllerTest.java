package com.example.backend.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.dto.ClientErrorLogRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class ObservabilityControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withOrgHeaders(T builder) {
        return (T)
                builder.header(ORG_ID_HEADER, ORG_ID).header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @Test
    @WithMockUser
    void testLogClientError() throws Exception {
        Map<String, Object> context = new HashMap<>();
        context.put("severity", "critical");
        context.put("component", "DossierService");

        ClientErrorLogRequest request =
                new ClientErrorLogRequest(
                        "Failed to load dossier data",
                        "error",
                        Instant.now().toString(),
                        "Mozilla/5.0",
                        "http://localhost:4200/dossiers",
                        "Error: Network timeout at line 42",
                        context);

        mockMvc.perform(
                        withOrgHeaders(
                                post("/api/v1/observability/client-errors")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logged").value(true))
                .andExpect(jsonPath("$.level").value("error"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    void testLogClientWarning() throws Exception {
        ClientErrorLogRequest request =
                new ClientErrorLogRequest(
                        "High memory usage detected",
                        "warning",
                        Instant.now().toString(),
                        "Mozilla/5.0",
                        "http://localhost:4200/dashboard",
                        null,
                        null);

        mockMvc.perform(
                        withOrgHeaders(
                                post("/api/v1/observability/client-errors")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logged").value(true))
                .andExpect(jsonPath("$.level").value("warning"));
    }

    @Test
    void testLogClientErrorUnauthorized() throws Exception {
        ClientErrorLogRequest request =
                new ClientErrorLogRequest(
                        "Test error",
                        "error",
                        Instant.now().toString(),
                        "Mozilla/5.0",
                        "http://localhost:4200",
                        null,
                        null);

        mockMvc.perform(
                        withOrgHeaders(
                                post("/api/v1/observability/client-errors")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void testLogClientErrorWithInvalidLevel() throws Exception {
        ClientErrorLogRequest request =
                new ClientErrorLogRequest(
                        "Test error",
                        "invalid",
                        Instant.now().toString(),
                        "Mozilla/5.0",
                        "http://localhost:4200",
                        null,
                        null);

        mockMvc.perform(
                        withOrgHeaders(
                                post("/api/v1/observability/client-errors")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(withOrgHeaders(get("/api/v1/observability/health")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
