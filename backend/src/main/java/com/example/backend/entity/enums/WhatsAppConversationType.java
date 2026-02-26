package com.example.backend.entity.enums;

import java.math.BigDecimal;

public enum WhatsAppConversationType {
    MARKETING("marketing", new BigDecimal("0.042")),
    UTILITY("utility", new BigDecimal("0.014")),
    AUTHENTICATION("authentication", new BigDecimal("0.012")),
    SERVICE("service", new BigDecimal("0.004"));

    private final String value;
    private final BigDecimal costPerConversation;

    WhatsAppConversationType(String value, BigDecimal costPerConversation) {
        this.value = value;
        this.costPerConversation = costPerConversation;
    }

    public String getValue() {
        return value;
    }

    public BigDecimal getCostPerConversation() {
        return costPerConversation;
    }

    public static WhatsAppConversationType fromValue(String value) {
        for (WhatsAppConversationType type : WhatsAppConversationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown WhatsAppConversationType value: " + value);
    }
}
