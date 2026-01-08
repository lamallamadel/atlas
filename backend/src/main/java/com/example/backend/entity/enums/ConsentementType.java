package com.example.backend.entity.enums;

public enum ConsentementType {
    MARKETING("marketing"),
    TRANSACTIONNEL("transactionnel"),
    PROFILING("profiling"),
    GESTIONNEL("gestionnel"),
    RECHERCHE("recherche");


    private final String value;

    ConsentementType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ConsentementType fromValue(String value) {
        for (ConsentementType type : ConsentementType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ConsentementType value: " + value);
    }
}
