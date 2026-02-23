package com.example.backend.performance;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HibernateStatisticsLogger {

    private static final Logger logger = LoggerFactory.getLogger(HibernateStatisticsLogger.class);
    private final Statistics statistics;


    public HibernateStatisticsLogger(EntityManagerFactory entityManagerFactory) {
        this.statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    }

    @Scheduled(fixedRate = 60000)
    public void logStatistics() {
        if (!statistics.isStatisticsEnabled()) {
            return;
        }

        logger.info("=== Hibernate Performance Statistics ===");
        logger.info("Queries executed: {}", statistics.getQueryExecutionCount());
        logger.info("Query cache hits: {}", statistics.getQueryCacheHitCount());
        logger.info("Query cache misses: {}", statistics.getQueryCacheMissCount());
        logger.info("Query cache puts: {}", statistics.getQueryCachePutCount());

        logger.info("Second level cache hits: {}", statistics.getSecondLevelCacheHitCount());
        logger.info("Second level cache misses: {}", statistics.getSecondLevelCacheMissCount());
        logger.info("Second level cache puts: {}", statistics.getSecondLevelCachePutCount());

        logger.info("Entities loaded: {}", statistics.getEntityLoadCount());
        logger.info("Entities updated: {}", statistics.getEntityUpdateCount());
        logger.info("Entities inserted: {}", statistics.getEntityInsertCount());
        logger.info("Entities deleted: {}", statistics.getEntityDeleteCount());
        logger.info("Entities fetched: {}", statistics.getEntityFetchCount());

        logger.info("Collections loaded: {}", statistics.getCollectionLoadCount());
        logger.info("Collections updated: {}", statistics.getCollectionUpdateCount());
        logger.info("Collections fetched: {}", statistics.getCollectionFetchCount());

        logger.info("Sessions opened: {}", statistics.getSessionOpenCount());
        logger.info("Sessions closed: {}", statistics.getSessionCloseCount());
        logger.info("Transactions: {}", statistics.getTransactionCount());
        logger.info("Successful transactions: {}", statistics.getSuccessfulTransactionCount());

        logger.info("Optimistic lock failures: {}", statistics.getOptimisticFailureCount());

        long preparedStatements = statistics.getPrepareStatementCount();
        long closedStatements = statistics.getCloseStatementCount();
        logger.info("Prepared statements: {}", preparedStatements);
        logger.info("Closed statements: {}", closedStatements);

        detectNPlusOneQueries();
    }

    private void detectNPlusOneQueries() {
        long entityFetchCount = statistics.getEntityFetchCount();
        long collectionFetchCount = statistics.getCollectionFetchCount();
        long queryExecutionCount = statistics.getQueryExecutionCount();

        if (entityFetchCount > queryExecutionCount * 10) {
            logger.warn("⚠️ POTENTIAL N+1 QUERY DETECTED: Entity fetch count ({}) is much higher than query count ({})",
                entityFetchCount, queryExecutionCount);
            logger.warn("Consider using JOIN FETCH or @EntityGraph to optimize queries");
        }

        if (collectionFetchCount > queryExecutionCount * 5) {
            logger.warn("⚠️ POTENTIAL N+1 QUERY DETECTED: Collection fetch count ({}) is much higher than query count ({})",
                collectionFetchCount, queryExecutionCount);
            logger.warn("Consider using JOIN FETCH for collections or batch fetching");
        }
    }

    public void logQueryStatistics() {
        String[] queries = statistics.getQueries();
        logger.info("=== Top Queries by Execution Count ===");
        for (String query : queries) {
            long executionCount = statistics.getQueryStatistics(query).getExecutionCount();
            long totalTime = statistics.getQueryStatistics(query).getExecutionTotalTime();
            long avgTime = executionCount > 0 ? totalTime / executionCount : 0;

            if (executionCount > 100) {
                logger.info("Query: {} | Executions: {} | Avg Time: {}ms",
                    truncateQuery(query), executionCount, avgTime);
            }
        }
    }

    private String truncateQuery(String query) {
        if (query.length() > 100) {
            return query.substring(0, 97) + "...";
        }
        return query;
    }

    @Scheduled(fixedRate = 300000)
    public void resetStatistics() {
        logger.info("Resetting Hibernate statistics");
        statistics.clear();
    }
}
