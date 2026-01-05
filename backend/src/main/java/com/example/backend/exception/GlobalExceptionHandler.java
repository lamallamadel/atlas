package com.example.backend.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String PROBLEM_JSON_MEDIA_TYPE = "application/problem+json";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, Object> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Bad Request",
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                request.getRequestURI()
        );
        problemDetail.addProperty("errors", errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleEntityNotFoundException(
            EntityNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Not Found",
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Forbidden",
                HttpStatus.FORBIDDEN.value(),
                "Access is denied",
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Unauthorized",
                HttpStatus.UNAUTHORIZED.value(),
                "Authentication failed",
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Bad Request",
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<ProblemDetail> handleInvalidStatusTransitionException(
            InvalidStatusTransitionException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Unprocessable Entity",
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(TenantHeaderMissingException.class)
    public ResponseEntity<ProblemDetail> handleTenantHeaderMissingException(
            TenantHeaderMissingException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Bad Request",
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }

    @ExceptionHandler(CrossTenantAccessException.class)
    public ResponseEntity<ProblemDetail> handleCrossTenantAccessException(
            CrossTenantAccessException ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Not Found",
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }


    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ProblemDetail> handleTypeMismatch(
                org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex,
                HttpServletRequest request
        ) {
                ProblemDetail pd = new ProblemDetail(
                        "about:blank",
        "Bad Request",
        400,
        "Invalid parameter value",
        request.getRequestURI()
        );
        // Optionnel : exposer plus de contexte
        pd.addProperty("parameter", ex.getName());
        pd.addProperty("value", String.valueOf(ex.getValue()));
        return ResponseEntity.badRequest()
        .contentType(org.springframework.http.MediaType.APPLICATION_PROBLEM_JSON)
        .body(pd);
        }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGenericException(
            Exception ex, HttpServletRequest request) {
        ProblemDetail problemDetail = new ProblemDetail(
                "about:blank",
                "Internal Server Error",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.parseMediaType(PROBLEM_JSON_MEDIA_TYPE))
                .body(problemDetail);
    }
}
