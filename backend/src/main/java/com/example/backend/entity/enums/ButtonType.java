package com.example.backend.entity.enums;

public enum ButtonType {
    QUICK_REPLY("quick_reply"),
    CALL_TO_ACTION("call_to_action"),
    URL("url"),
    PHONE_NUMBER("phone_number");

    private final String value;

    ButtonType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ButtonType fromValue(String value) {
        for (ButtonType type : ButtonType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ButtonType value: " + value);
    }
}
