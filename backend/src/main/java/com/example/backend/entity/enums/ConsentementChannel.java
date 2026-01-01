package com.example.backend.entity.enums;

public enum ConsentementChannel {
    EMAIL("email"),
    SMS("sms"),
    PHONE("phone"),
    WHATSAPP("whatsapp"),
    POSTAL_MAIL("postal_mail"),
    IN_PERSON("in_person");

    private final String value;

    ConsentementChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ConsentementChannel fromValue(String value) {
        for (ConsentementChannel channel : ConsentementChannel.values()) {
            if (channel.value.equals(value)) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Unknown ConsentementChannel value: " + value);
    }
}
