package com.example.backend.dto;

public class PongResponse {

    private String message;

    public PongResponse() {
    }

    public PongResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
