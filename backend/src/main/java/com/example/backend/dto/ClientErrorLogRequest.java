package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.Map;

public record ClientErrorLogRequest(
    @NotBlank(message = "Message is required")
    String message,

    @NotBlank(message = "Level is required")
    @Pattern(regexp = "error|warning|info", message = "Level must be one of: error, warning, info")
    String level,

    @NotBlank(message = "Timestamp is required")
    String timestamp,

    @NotBlank(message = "User agent is required")
    String userAgent,

    @NotBlank(message = "URL is required")
    String url,

    String stackTrace,

    Map<String, Object> context
) {}
