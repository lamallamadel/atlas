package com.example.backend.entity.enums;

public enum AuditEntityType {
    ANNONCE("annonce"),
    DOSSIER("dossier"),
    PARTIE_PRENANTE("partie_prenante"),
    CONSENTEMENT("consentement"),
    MESSAGE("message"),
    APPOINTMENT("appointment"),
    USER("user"),
    ORGANIZATION("organization");

    private final String value;

    AuditEntityType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AuditEntityType fromValue(String value) {
        for (AuditEntityType type : AuditEntityType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown AuditEntityType value: " + value);
    }
}
