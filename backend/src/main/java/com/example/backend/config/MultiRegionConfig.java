package com.example.backend.config;

import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "multi-region")
public class MultiRegionConfig {

    private String currentRegion;
    private boolean replicationEnabled = true;
    private Map<String, RegionConfig> regions = new HashMap<>();
    private ReplicationConfig replication = new ReplicationConfig();

    public String getCurrentRegion() {
        return currentRegion;
    }

    public void setCurrentRegion(String currentRegion) {
        this.currentRegion = currentRegion;
    }

    public boolean isReplicationEnabled() {
        return replicationEnabled;
    }

    public void setReplicationEnabled(boolean replicationEnabled) {
        this.replicationEnabled = replicationEnabled;
    }

    public Map<String, RegionConfig> getRegions() {
        return regions;
    }

    public void setRegions(Map<String, RegionConfig> regions) {
        this.regions = regions;
    }

    public ReplicationConfig getReplication() {
        return replication;
    }

    public void setReplication(ReplicationConfig replication) {
        this.replication = replication;
    }

    public static class RegionConfig {
        private String name;
        private String endpoint;
        private String dbEndpoint;
        private boolean isPrimary;
        private int priority;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getDbEndpoint() {
            return dbEndpoint;
        }

        public void setDbEndpoint(String dbEndpoint) {
            this.dbEndpoint = dbEndpoint;
        }

        public boolean isPrimary() {
            return isPrimary;
        }

        public void setPrimary(boolean primary) {
            isPrimary = primary;
        }

        public int getPriority() {
            return priority;
        }

        public void setPriority(int priority) {
            this.priority = priority;
        }
    }

    public static class ReplicationConfig {
        private String publicationName = "atlas_publication";
        private String subscriptionName = "atlas_subscription";
        private boolean autoResolveConflicts = true;
        private String conflictResolutionStrategy = "LAST_WRITE_WINS";
        private boolean syncGlobalEntities = true;
        private boolean isolateRegionalData = true;

        public String getPublicationName() {
            return publicationName;
        }

        public void setPublicationName(String publicationName) {
            this.publicationName = publicationName;
        }

        public String getSubscriptionName() {
            return subscriptionName;
        }

        public void setSubscriptionName(String subscriptionName) {
            this.subscriptionName = subscriptionName;
        }

        public boolean isAutoResolveConflicts() {
            return autoResolveConflicts;
        }

        public void setAutoResolveConflicts(boolean autoResolveConflicts) {
            this.autoResolveConflicts = autoResolveConflicts;
        }

        public String getConflictResolutionStrategy() {
            return conflictResolutionStrategy;
        }

        public void setConflictResolutionStrategy(String conflictResolutionStrategy) {
            this.conflictResolutionStrategy = conflictResolutionStrategy;
        }

        public boolean isSyncGlobalEntities() {
            return syncGlobalEntities;
        }

        public void setSyncGlobalEntities(boolean syncGlobalEntities) {
            this.syncGlobalEntities = syncGlobalEntities;
        }

        public boolean isIsolateRegionalData() {
            return isolateRegionalData;
        }

        public void setIsolateRegionalData(boolean isolateRegionalData) {
            this.isolateRegionalData = isolateRegionalData;
        }
    }
}
