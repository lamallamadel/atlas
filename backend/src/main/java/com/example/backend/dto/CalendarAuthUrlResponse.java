package com.example.backend.dto;

public class CalendarAuthUrlResponse {
    private String authUrl;

    public CalendarAuthUrlResponse() {
    }

    public CalendarAuthUrlResponse(String authUrl) {
        this.authUrl = authUrl;
    }

    public String getAuthUrl() {
        return authUrl;
    }

    public void setAuthUrl(String authUrl) {
        this.authUrl = authUrl;
    }
}
