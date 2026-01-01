package com.example.backend.entity.enums;

public enum MessageChannel {
    EMAIL("email"),
    SMS("sms"),
    WHATSAPP("whatsapp"),
    PHONE("phone"),
    CHAT("chat"),
    IN_APP("in_app");

    private final String value;

    MessageChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MessageChannel fromValue(String value) {
        for (MessageChannel channel : MessageChannel.values()) {
            if (channel.value.equals(value)) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Unknown MessageChannel value: " + value);
    }
}
