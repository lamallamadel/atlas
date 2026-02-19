package com.example.backend.entity.enums;

public enum DossierSource {
    WEB("web"),
    MOBILE("mobile"),
    PHONE("phone"),
    EMAIL("email"),
    REFERRAL("referral"),
    WALK_IN("walk_in"),
    SOCIAL_MEDIA("social_media"),
    UNKNOWN("unknown");

    private final String value;

    DossierSource(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static DossierSource fromValue(String value) {
        for (DossierSource source : DossierSource.values()) {
            if (source.value.equals(value)) {
                return source;
            }
        }
        throw new IllegalArgumentException("Unknown DossierSource value: " + value);
    }
}
