package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CalendarOAuthCallbackRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    public CalendarOAuthCallbackRequest() {}

    public CalendarOAuthCallbackRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
