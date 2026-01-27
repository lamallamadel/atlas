package com.example.backend.util;

public final class TenantContext {
    private static final ThreadLocal<String> ORG_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();

    private TenantContext() {}

    public static void setOrgId(String orgId) {
        ORG_ID.set(orgId);
    }

    /**
     * Backward-compatible alias.
     * <p>
     * The domain model uses the term {@code orgId}. Some code paths (notably reporting)
     * were initially authored with a {@code tenantId} naming convention.
     */
    public static void setTenantId(String tenantId) {
        setOrgId(tenantId);
    }

    public static String getOrgId() {
        return ORG_ID.get();
    }

    /**
     * Backward-compatible alias for {@link #getOrgId()}.
     */
    public static String getTenantId() {
        return getOrgId();
    }

    public static void setUserId(String userId) {
        USER_ID.set(userId);
    }

    public static String getUserId() {
        return USER_ID.get();
    }

    public static void clear() {
        ORG_ID.remove();
        USER_ID.remove();
    }
}
