package com.example.backend.util;

public final class TenantContext {
    private static final ThreadLocal<String> ORG_ID = new ThreadLocal<>();

    private TenantContext() {}

    public static void setOrgId(String orgId) {
        ORG_ID.set(orgId);
    }

    public static String getOrgId() {
        return ORG_ID.get();
    }

    public static void clear() {
        ORG_ID.remove();
    }
}
