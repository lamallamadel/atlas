package com.example.backend.exception;

public class TenantHeaderMissingException extends RuntimeException {

    public TenantHeaderMissingException(String message) {
        super(message);
    }

    public TenantHeaderMissingException() {
        super("Required tenant header is missing");
    }
}
