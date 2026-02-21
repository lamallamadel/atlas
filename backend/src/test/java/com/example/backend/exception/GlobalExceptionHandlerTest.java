package com.example.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = Mockito.mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/dossiers");
    }

    @Test
    void handleIllegalArgumentException_shouldReturnBadRequestWithMessage() {
        String errorMessage = "Page size must be at least 1";
        IllegalArgumentException exception = new IllegalArgumentException(errorMessage);

        ResponseEntity<ProblemDetail> response =
                handler.handleIllegalArgumentException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetail()).isEqualTo(errorMessage);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getTitle()).isEqualTo("Bad Request");
        assertThat(response.getBody().getInstance()).isEqualTo("/api/v1/dossiers");
    }

    @Test
    void handleIllegalArgumentException_shouldHandleNegativePageNumberMessage() {
        String errorMessage = "Page number must be at least 0";
        IllegalArgumentException exception = new IllegalArgumentException(errorMessage);

        ResponseEntity<ProblemDetail> response =
                handler.handleIllegalArgumentException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetail()).isEqualTo(errorMessage);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
    }
}
