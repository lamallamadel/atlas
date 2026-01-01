package com.example.backend.entity.enums;

public enum MessageDirection {
    INBOUND("inbound"),
    OUTBOUND("outbound");

    private final String value;

    MessageDirection(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MessageDirection fromValue(String value) {
        for (MessageDirection direction : MessageDirection.values()) {
            if (direction.value.equals(value)) {
                return direction;
            }
        }
        throw new IllegalArgumentException("Unknown MessageDirection value: " + value);
    }
}
