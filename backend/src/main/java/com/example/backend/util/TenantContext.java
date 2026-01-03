package com.example.backend.util;

public class TenantContext {

    private static final ThreadLocal<String> orgIdHolder = new ThreadLocal<>();

    public static void setOrgId(String orgId) {
        orgIdHolder.set(orgId);
    }

    public static String getOrgId() {
        return orgIdHolder.get();
    }

    public static void clear() {
        orgIdHolder.remove();
    }
}
