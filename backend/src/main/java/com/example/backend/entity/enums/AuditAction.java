package com.example.backend.entity.enums;

public enum AuditAction {
    CREATED("created"),
    UPDATED("updated"),
    DELETED("deleted"),
    VIEWED("viewed"),
    EXPORTED("exported"),
    IMPORTED("imported"),
    APPROVED("approved"),
    REJECTED("rejected"),
    ARCHIVED("archived"),
    RESTORED("restored"),
    SENT("sent"),
    FAILED("failed"),
    BLOCKED_BY_POLICY("blocked_by_policy"),
    ACTIVATE("activate"),
    DEACTIVATE("deactivate"),
    SUBMIT_FOR_APPROVAL("submit_for_approval"),
    CREATE("create"),
    UPDATE("update"),
    DELETE("delete"),
    APPROVE("approve"),
    REJECT("reject"),
    RELOAD("reload"),
    CONFIG_HEALTH_CHECK("config_health_check");

    private final String value;

    AuditAction(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AuditAction fromValue(String value) {
        for (AuditAction action : AuditAction.values()) {
            if (action.value.equals(value)) {
                return action;
            }
        }
        throw new IllegalArgumentException("Unknown AuditAction value: " + value);
    }
}
