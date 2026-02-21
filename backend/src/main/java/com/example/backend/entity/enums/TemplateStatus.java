package com.example.backend.entity.enums;

public enum TemplateStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected"),
    PAUSED("paused"),
    DRAFT("draft");

    private final String value;

    TemplateStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static TemplateStatus fromValue(String value) {
        for (TemplateStatus status : TemplateStatus.values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown TemplateStatus value: " + value);
    }
}
