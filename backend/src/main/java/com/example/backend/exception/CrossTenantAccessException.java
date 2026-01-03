package com.example.backend.exception;

public class CrossTenantAccessException extends RuntimeException {

    public CrossTenantAccessException(String message) {
        super(message);
    }

    public CrossTenantAccessException() {
        super("Resource not found");
    }
}
