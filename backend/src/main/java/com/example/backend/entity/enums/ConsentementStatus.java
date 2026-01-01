package com.example.backend.entity.enums;

public enum ConsentementStatus {
    GRANTED("granted"),
    DENIED("denied"),
    PENDING("pending"),
    REVOKED("revoked"),
    EXPIRED("expired");

    private final String value;

    ConsentementStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ConsentementStatus fromValue(String value) {
        for (ConsentementStatus status : ConsentementStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ConsentementStatus value: " + value);
    }
}
