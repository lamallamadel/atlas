package com.example.backend.entity.enums;

public enum OutboundAttemptStatus {
    TRYING("trying"),
    SUCCESS("success"),
    FAILED("failed");

    private final String value;

    OutboundAttemptStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static OutboundAttemptStatus fromValue(String value) {
        for (OutboundAttemptStatus status : OutboundAttemptStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown OutboundAttemptStatus value: " + value);
    }
}
