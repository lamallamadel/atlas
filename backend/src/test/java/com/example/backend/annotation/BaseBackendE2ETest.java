package com.example.backend.annotation;

import com.example.backend.exception.ProblemDetail;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public abstract class BaseBackendE2ETest {

    protected static final String TENANT_HEADER = "X-Org-Id";
    protected static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected HttpHeaders buildHeaders(String tenantId, String correlationId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(TENANT_HEADER, tenantId);
        headers.set(CORRELATION_ID_HEADER, correlationId);
        return headers;
    }

    protected HttpHeaders buildHeaders(String tenantId) {
        return buildHeaders(tenantId, "test-correlation-id");
    }

    protected HttpHeaders buildHeadersWithAuth(String tenantId, String correlationId, String bearerToken) {
        HttpHeaders headers = buildHeaders(tenantId, correlationId);
        headers.setBearerAuth(bearerToken);
        return headers;
    }

    protected HttpHeaders buildHeadersWithAuth(String tenantId, String bearerToken) {
        return buildHeadersWithAuth(tenantId, "test-correlation-id", bearerToken);
    }

    protected <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withTenantHeaders(
            T builder, String tenantId, String correlationId) {
        return (T) builder
                .header(TENANT_HEADER, tenantId)
                .header(CORRELATION_ID_HEADER, correlationId);
    }

    protected <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withTenantHeaders(
            T builder, String tenantId) {
        return withTenantHeaders(builder, tenantId, "test-correlation-id");
    }

    protected void assertProblemDetail(ResultActions resultActions, int expectedStatus, String expectedDetail) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").value(expectedDetail));
    }

    protected void assertProblemDetailContains(ResultActions resultActions, int expectedStatus, String detailSubstring) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").exists());

        String responseContent = resultActions.andReturn().getResponse().getContentAsString();
        ProblemDetail problemDetail = objectMapper.readValue(responseContent, ProblemDetail.class);
        assertThat(problemDetail.getDetail()).contains(detailSubstring);
    }

    protected void assertProblemDetail(ResultActions resultActions, int expectedStatus) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").exists());
    }
}
