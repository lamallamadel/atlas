package com.example.backend.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String PROBLEM_JSON_MEDIA_TYPE = "application/problem+json";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        // Keep stable ordering + first message per field
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }

        // Tests expect detail to contain the single message when only 1 error exists
        String detail = "Validation failed";
        if (errors.size() == 1) {
            detail = errors.values().iterator().next();
        }

        ProblemDetail pd =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        detail,
                        request.getRequestURI());

        // Preserve your existing payload shape:
        // { ..., "properties": { "errors": { field: message } } }
        pd.addProperty("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(pd);
    }

    /**
     * Covers Jackson deserialization errors (e.g. invalid enum value in JSON). Without this, it
     * falls into the generic handler and returns 500.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        ProblemDetail pd =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        "Invalid request body",
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(pd);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleEntityNotFoundException(
            EntityNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Not Found",
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Not Found",
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Forbidden",
                        HttpStatus.FORBIDDEN.value(),
                        "Access is denied",
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Unauthorized",
                        HttpStatus.UNAUTHORIZED.value(),
                        "Authentication failed",
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<ProblemDetail> handleInvalidStatusTransitionException(
            InvalidStatusTransitionException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(WorkflowValidationException.class)
    public ResponseEntity<ProblemDetail> handleWorkflowValidationException(
            WorkflowValidationException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Workflow Validation Failed",
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        if (ex.getValidationErrors() != null) {
            problemDetail.addProperty("validationErrors", ex.getValidationErrors());

            Map<String, Object> errors = ex.getValidationErrors();
            if (errors.containsKey("missingRequiredFields")) {
                problemDetail.addProperty("errorType", "MISSING_REQUIRED_FIELDS");
            } else if (errors.containsKey("roleAuthorizationError")) {
                problemDetail.addProperty("errorType", "ROLE_AUTHORIZATION_FAILED");
            } else if (errors.containsKey("preConditionError")) {
                problemDetail.addProperty("errorType", "PRE_CONDITION_NOT_MET");
            } else if (errors.containsKey("failedConditions")) {
                problemDetail.addProperty("errorType", "CUSTOM_CONDITION_FAILED");
            } else if (errors.containsKey("transition")) {
                problemDetail.addProperty("errorType", "INVALID_TRANSITION");
            }
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(TenantHeaderMissingException.class)
    public ResponseEntity<ProblemDetail> handleTenantHeaderMissingException(
            TenantHeaderMissingException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        "Missing organization context",
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(CrossTenantAccessException.class)
    public ResponseEntity<ProblemDetail> handleCrossTenantAccessException(
            CrossTenantAccessException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Not Found",
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<ProblemDetail> handleFileValidationException(
            FileValidationException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ProblemDetail> handleUnauthorizedAccessException(
            UnauthorizedAccessException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Forbidden",
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ProblemDetail pd =
                new ProblemDetail(
                        "about:blank",
                        "Bad Request",
                        HttpStatus.BAD_REQUEST.value(),
                        "Invalid parameter value",
                        request.getRequestURI());
        pd.addProperty("parameter", ex.getName());
        pd.addProperty("value", String.valueOf(ex.getValue()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(pd);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGenericException(
            Exception ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                new ProblemDetail(
                        "about:blank",
                        "Internal Server Error",
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "An unexpected error occurred",
                        request.getRequestURI());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }
}
