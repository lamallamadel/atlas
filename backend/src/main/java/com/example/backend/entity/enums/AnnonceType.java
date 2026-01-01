package com.example.backend.entity.enums;

public enum AnnonceType {
    SALE("sale"),
    RENT("rent"),
    LEASE("lease"),
    EXCHANGE("exchange");

    private final String value;

    AnnonceType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AnnonceType fromValue(String value) {
        for (AnnonceType type : AnnonceType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown AnnonceType value: " + value);
    }
}
