package com.example.backend.utils;

import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Component
public class DatabaseCompatibilityHelper {

    private final String databaseType;

    public DatabaseCompatibilityHelper() {
        this.databaseType = System.getProperty("test.database", "h2");
    }

    public boolean isH2() {
        return "h2".equalsIgnoreCase(databaseType);
    }

    public boolean isPostgres() {
        return "postgres".equalsIgnoreCase(databaseType) || "postgresql".equalsIgnoreCase(databaseType);
    }

    public UUID generateUUID() {
        return UUID.randomUUID();
    }

    public Timestamp normalizeTimestamp(Instant instant) {
        if (isH2()) {
            LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            localDateTime = localDateTime.withNano((localDateTime.getNano() / 1_000_000) * 1_000_000);
            return Timestamp.valueOf(localDateTime);
        }
        return Timestamp.from(instant);
    }

    public Timestamp normalizeTimestamp(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }
        return normalizeTimestamp(timestamp.toInstant());
    }

    public boolean timestampsEqual(Instant instant1, Instant instant2, long toleranceMillis) {
        if (instant1 == null && instant2 == null) {
            return true;
        }
        if (instant1 == null || instant2 == null) {
            return false;
        }
        
        long diff = Math.abs(instant1.toEpochMilli() - instant2.toEpochMilli());
        return diff <= toleranceMillis;
    }

    public boolean timestampsEqual(Timestamp ts1, Timestamp ts2, long toleranceMillis) {
        if (ts1 == null && ts2 == null) {
            return true;
        }
        if (ts1 == null || ts2 == null) {
            return false;
        }
        return timestampsEqual(ts1.toInstant(), ts2.toInstant(), toleranceMillis);
    }

    public String getJsonColumnDefinition() {
        return isPostgres() ? "jsonb" : "json";
    }

    public String getSequenceNextValSql(String sequenceName) {
        if (isPostgres()) {
            return "SELECT nextval('" + sequenceName + "')";
        } else {
            return "SELECT NEXT VALUE FOR " + sequenceName;
        }
    }

    public String getDatabaseType() {
        return databaseType;
    }
}
