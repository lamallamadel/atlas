package com.example.backend.entity.enums;

public enum OutboundMessageStatus {
    QUEUED("queued"),
    SENDING("sending"),
    SENT("sent"),
    DELIVERED("delivered"),
    FAILED("failed"),
    CANCELLED("cancelled"),
    THROTTLED("throttled");

    private final String value;

    OutboundMessageStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static OutboundMessageStatus fromValue(String value) {
        for (OutboundMessageStatus status : OutboundMessageStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown OutboundMessageStatus value: " + value);
    }
}
