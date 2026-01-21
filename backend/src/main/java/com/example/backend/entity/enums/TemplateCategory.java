package com.example.backend.entity.enums;

public enum TemplateCategory {
    MARKETING("marketing"),
    UTILITY("utility"),
    AUTHENTICATION("authentication"),
    TRANSACTIONAL("transactional");

    private final String value;

    TemplateCategory(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static TemplateCategory fromValue(String value) {
        for (TemplateCategory category : TemplateCategory.values()) {
            if (category.value.equals(value)) {
                return category;
            }
        }
        throw new IllegalArgumentException("Unknown TemplateCategory value: " + value);
    }
}
