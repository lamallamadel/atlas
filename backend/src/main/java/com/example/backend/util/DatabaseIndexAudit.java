package com.example.backend.util;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DatabaseIndexAudit {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseIndexAudit.class);

    private final EntityManager entityManager;

    public DatabaseIndexAudit(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<IndexRecommendation> auditMissingIndexes() {
        List<IndexRecommendation> recommendations = new ArrayList<>();

        Map<String, List<String>> foreignKeyColumns = new HashMap<>();
        foreignKeyColumns.put("dossier", Arrays.asList("annonce_id", "lead_phone", "lead_email", "status", "case_type", "created_by", "org_id", "source"));
        foreignKeyColumns.put("partie_prenante", Arrays.asList("dossier_id", "role", "phone", "email", "org_id"));
        foreignKeyColumns.put("appointment", Arrays.asList("dossier_id", "status", "start_time", "end_time", "org_id"));
        foreignKeyColumns.put("message", Arrays.asList("dossier_id", "channel", "direction", "timestamp", "org_id"));
        foreignKeyColumns.put("annonce", Arrays.asList("status", "type", "city", "org_id", "created_at"));
        foreignKeyColumns.put("notification", Arrays.asList("user_id", "status", "type", "created_at", "org_id"));
        foreignKeyColumns.put("outbound_message", Arrays.asList("status", "attempt_count", "channel", "created_at", "next_retry_at", "org_id"));
        foreignKeyColumns.put("outbound_attempt", Arrays.asList("message_id", "status", "attempt_no", "next_retry_at", "attempted_at"));
        foreignKeyColumns.put("dossier_status_history", Arrays.asList("dossier_id", "from_status", "to_status", "transitioned_at", "org_id"));

        for (Map.Entry<String, List<String>> entry : foreignKeyColumns.entrySet()) {
            String tableName = entry.getKey();
            List<String> columns = entry.getValue();

            Set<String> existingIndexes = getExistingIndexes(tableName);

            for (String column : columns) {
                if (!isColumnIndexed(existingIndexes, column)) {
                    recommendations.add(new IndexRecommendation(
                            tableName,
                            column,
                            "Missing index on frequently filtered/joined column",
                            generateIndexName(tableName, column),
                            String.format("CREATE INDEX %s ON %s(%s);",
                                    generateIndexName(tableName, column), tableName, column)
                    ));
                }
            }
        }

        recommendations.addAll(auditCompositeIndexes());

        return recommendations;
    }

    private List<IndexRecommendation> auditCompositeIndexes() {
        List<IndexRecommendation> recommendations = new ArrayList<>();

        Map<String, List<List<String>>> compositeIndexCandidates = new HashMap<>();
        compositeIndexCandidates.put("dossier", Arrays.asList(
                Arrays.asList("org_id", "status"),
                Arrays.asList("org_id", "lead_phone"),
                Arrays.asList("org_id", "created_at")
        ));
        compositeIndexCandidates.put("annonce", Arrays.asList(
                Arrays.asList("org_id", "status"),
                Arrays.asList("org_id", "city"),
                Arrays.asList("org_id", "type")
        ));
        compositeIndexCandidates.put("message", Arrays.asList(
                Arrays.asList("dossier_id", "direction"),
                Arrays.asList("dossier_id", "timestamp")
        ));
        compositeIndexCandidates.put("outbound_message", Arrays.asList(
                Arrays.asList("status", "attempt_count"),
                Arrays.asList("org_id", "status")
        ));

        for (Map.Entry<String, List<List<String>>> entry : compositeIndexCandidates.entrySet()) {
            String tableName = entry.getKey();
            List<List<String>> compositeColumns = entry.getValue();

            Set<String> existingIndexes = getExistingIndexes(tableName);

            for (List<String> columns : compositeColumns) {
                String compositeIndexName = generateCompositeIndexName(tableName, columns);
                if (!existingIndexes.contains(compositeIndexName.toLowerCase())) {
                    recommendations.add(new IndexRecommendation(
                            tableName,
                            String.join(", ", columns),
                            "Missing composite index for common query pattern",
                            compositeIndexName,
                            String.format("CREATE INDEX %s ON %s(%s);",
                                    compositeIndexName, tableName, String.join(", ", columns))
                    ));
                }
            }
        }

        return recommendations;
    }

    private Set<String> getExistingIndexes(String tableName) {
        Set<String> indexes = new HashSet<>();

        try {
            String sql = """
                SELECT 
                    i.relname as index_name,
                    a.attname as column_name
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                WHERE t.relname = :tableName
                AND t.relkind = 'r'
                """;

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter("tableName", tableName);

            @SuppressWarnings("unchecked")
            List<Object[]> results = query.getResultList();

            for (Object[] row : results) {
                String indexName = (String) row[0];
                String columnName = (String) row[1];
                indexes.add(indexName.toLowerCase());
                indexes.add(columnName.toLowerCase());
            }
        } catch (Exception e) {
            logger.warn("Could not retrieve indexes for table {}: {}", tableName, e.getMessage());
        }

        return indexes;
    }

    private boolean isColumnIndexed(Set<String> existingIndexes, String column) {
        return existingIndexes.contains(column.toLowerCase()) ||
                existingIndexes.stream().anyMatch(idx -> idx.contains(column.toLowerCase()));
    }

    private String generateIndexName(String tableName, String column) {
        return String.format("idx_%s_%s", tableName, column);
    }

    private String generateCompositeIndexName(String tableName, List<String> columns) {
        return String.format("idx_%s_%s", tableName, String.join("_", columns));
    }

    public void logAuditResults() {
        List<IndexRecommendation> recommendations = auditMissingIndexes();

        if (recommendations.isEmpty()) {
            logger.info("Database index audit: All recommended indexes are present");
        } else {
            logger.warn("Database index audit: Found {} missing indexes", recommendations.size());
            for (IndexRecommendation rec : recommendations) {
                logger.warn("Missing index on {}.{}: {}", rec.getTableName(), rec.getColumnName(), rec.getReason());
                logger.info("Recommendation: {}", rec.getSqlStatement());
            }
        }
    }

    public static class IndexRecommendation {
        private final String tableName;
        private final String columnName;
        private final String reason;
        private final String indexName;
        private final String sqlStatement;

        public IndexRecommendation(String tableName, String columnName, String reason, String indexName, String sqlStatement) {
            this.tableName = tableName;
            this.columnName = columnName;
            this.reason = reason;
            this.indexName = indexName;
            this.sqlStatement = sqlStatement;
        }

        public String getTableName() {
            return tableName;
        }

        public String getColumnName() {
            return columnName;
        }

        public String getReason() {
            return reason;
        }

        public String getIndexName() {
            return indexName;
        }

        public String getSqlStatement() {
            return sqlStatement;
        }
    }
}
