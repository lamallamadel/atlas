package com.example.backend.entity.enums;

public enum ComponentType {
    HEADER("header"),
    BODY("body"),
    FOOTER("footer"),
    BUTTONS("buttons");

    private final String value;

    ComponentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ComponentType fromValue(String value) {
        for (ComponentType type : ComponentType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ComponentType value: " + value);
    }
}
