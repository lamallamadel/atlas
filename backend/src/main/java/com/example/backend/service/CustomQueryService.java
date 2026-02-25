package com.example.backend.service;

import com.example.backend.entity.CustomQueryEntity;
import com.example.backend.repository.CustomQueryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomQueryService {

    private static final Logger logger = LoggerFactory.getLogger(CustomQueryService.class);

    private static final Pattern DANGEROUS_PATTERNS =
            Pattern.compile(
                    "(DROP|DELETE|TRUNCATE|INSERT|UPDATE|ALTER|CREATE|GRANT|REVOKE)\\s+",
                    Pattern.CASE_INSENSITIVE);

    private final CustomQueryRepository customQueryRepository;
    private final EntityManager entityManager;

    public CustomQueryService(
            CustomQueryRepository customQueryRepository, EntityManager entityManager) {
        this.customQueryRepository = customQueryRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public CustomQueryEntity createCustomQuery(String orgId, CustomQueryEntity query) {
        logger.info("Creating custom query for org: {}", orgId);

        validateQuery(query.getSqlQuery());

        query.setOrgId(orgId);
        query.setIsApproved(false);

        return customQueryRepository.save(query);
    }

    @Transactional(readOnly = true)
    public Page<CustomQueryEntity> getCustomQueries(String orgId, Pageable pageable) {
        return customQueryRepository.findByOrgId(orgId, pageable);
    }

    @Transactional(readOnly = true)
    public CustomQueryEntity getCustomQuery(Long id, String orgId) {
        CustomQueryEntity query =
                customQueryRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Query not found"));

        if (!query.getOrgId().equals(orgId)) {
            throw new RuntimeException("Access denied");
        }

        return query;
    }

    @Transactional
    public CustomQueryEntity updateCustomQuery(
            Long id, String orgId, CustomQueryEntity updatedQuery) {
        CustomQueryEntity query = getCustomQuery(id, orgId);

        validateQuery(updatedQuery.getSqlQuery());

        query.setName(updatedQuery.getName());
        query.setDescription(updatedQuery.getDescription());
        query.setSqlQuery(updatedQuery.getSqlQuery());
        query.setParameters(updatedQuery.getParameters());
        query.setIsPublic(updatedQuery.getIsPublic());
        query.setCategory(updatedQuery.getCategory());
        query.setIsApproved(false);

        return customQueryRepository.save(query);
    }

    @Transactional
    public void deleteCustomQuery(Long id, String orgId) {
        CustomQueryEntity query = getCustomQuery(id, orgId);
        customQueryRepository.delete(query);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> executeCustomQuery(
            Long id, String orgId, Map<String, Object> params) {
        CustomQueryEntity query = getCustomQuery(id, orgId);

        if (!query.getIsApproved()) {
            throw new RuntimeException("Query must be approved before execution");
        }

        logger.info("Executing custom query: {} for org: {}", id, orgId);

        long startTime = System.currentTimeMillis();

        try {
            validateQuery(query.getSqlQuery());

            String sql = query.getSqlQuery();

            for (Map.Entry<String, Object> entry : params.entrySet()) {
                sql = sql.replace(":" + entry.getKey(), "'" + entry.getValue().toString() + "'");
            }

            Query nativeQuery = entityManager.createNativeQuery(sql);

            nativeQuery.setMaxResults(1000);

            @SuppressWarnings("unchecked")
            List<Object[]> results = nativeQuery.getResultList();

            List<Map<String, Object>> formattedResults = new ArrayList<>();

            for (Object[] row : results) {
                Map<String, Object> rowMap = new HashMap<>();
                for (int i = 0; i < row.length; i++) {
                    rowMap.put("col_" + i, row[i]);
                }
                formattedResults.add(rowMap);
            }

            long executionTime = System.currentTimeMillis() - startTime;
            updateQueryStats(query, executionTime);

            return formattedResults;

        } catch (Exception e) {
            logger.error("Error executing custom query: {}", id, e);
            throw new RuntimeException("Query execution failed: " + e.getMessage());
        }
    }

    @Transactional
    public CustomQueryEntity approveQuery(Long id, String approverUserId) {
        CustomQueryEntity query =
                customQueryRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Query not found"));

        query.setIsApproved(true);
        query.setApprovedBy(approverUserId);

        return customQueryRepository.save(query);
    }

    @Transactional(readOnly = true)
    public List<CustomQueryEntity> getPublicQueries(String orgId) {
        return customQueryRepository.findByOrgIdAndIsPublic(orgId, true);
    }

    @Transactional(readOnly = true)
    public List<CustomQueryEntity> getQueriesByCategory(String orgId, String category) {
        return customQueryRepository.findByOrgIdAndCategory(orgId, category);
    }

    private void validateQuery(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        if (DANGEROUS_PATTERNS.matcher(sql).find()) {
            throw new IllegalArgumentException(
                    "Query contains forbidden SQL operations. Only SELECT queries are allowed.");
        }

        if (!sql.trim().toUpperCase().startsWith("SELECT")) {
            throw new IllegalArgumentException("Only SELECT queries are allowed");
        }

        if (sql.contains(";") && sql.indexOf(";") < sql.length() - 1) {
            throw new IllegalArgumentException("Multiple statements are not allowed");
        }
    }

    private void updateQueryStats(CustomQueryEntity query, long executionTime) {
        Long currentCount = query.getExecutionCount();
        Long currentAvg = query.getAvgExecutionTimeMs();

        Long newCount = currentCount + 1;
        Long newAvg =
                currentAvg != null
                        ? (currentAvg * currentCount + executionTime) / newCount
                        : executionTime;

        query.setExecutionCount(newCount);
        query.setAvgExecutionTimeMs(newAvg);

        customQueryRepository.save(query);
    }
}
