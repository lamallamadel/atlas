package com.example.backend.performance;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(
        name = "performance.monitoring.enabled",
        havingValue = "true",
        matchIfMissing = true)
@ConditionalOnBean(RedisCacheService.class)
public class PerformanceMonitoringService {

    private static final Logger logger =
            LoggerFactory.getLogger(PerformanceMonitoringService.class);

    private final DataSource dataSource;
    private final RedisCacheService redisCacheService;

    public PerformanceMonitoringService(
            DataSource dataSource, RedisCacheService redisCacheService) {
        this.dataSource = dataSource;
        this.redisCacheService = redisCacheService;
    }

    @Scheduled(fixedRate = 60000)
    public void monitorConnectionPool() {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();

            logger.info("=== HikariCP Connection Pool Metrics ===");
            logger.info("Active connections: {}", poolMXBean.getActiveConnections());
            logger.info("Idle connections: {}", poolMXBean.getIdleConnections());
            logger.info("Total connections: {}", poolMXBean.getTotalConnections());
            logger.info(
                    "Threads awaiting connection: {}", poolMXBean.getThreadsAwaitingConnection());

            int activeConnections = poolMXBean.getActiveConnections();
            int totalConnections = poolMXBean.getTotalConnections();

            if (totalConnections > 0) {
                double utilizationPercent = (double) activeConnections / totalConnections * 100;
                logger.info("Pool utilization: {:.2f}%", utilizationPercent);

                if (utilizationPercent > 80) {
                    logger.warn(
                            "⚠️ HIGH CONNECTION POOL UTILIZATION: {:.2f}% - Consider increasing pool size",
                            utilizationPercent);
                }
            }

            if (poolMXBean.getThreadsAwaitingConnection() > 0) {
                logger.warn(
                        "⚠️ THREADS WAITING FOR CONNECTION: {} - Pool may be undersized",
                        poolMXBean.getThreadsAwaitingConnection());
            }
        }
    }

    @Scheduled(fixedRate = 120000)
    public void monitorCachePerformance() {
        redisCacheService.logCacheStats();
    }

    public PerformanceMetrics getCurrentMetrics() {
        PerformanceMetrics metrics = new PerformanceMetrics();

        if (dataSource instanceof HikariDataSource hikariDataSource) {
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            metrics.setActiveConnections(poolMXBean.getActiveConnections());
            metrics.setIdleConnections(poolMXBean.getIdleConnections());
            metrics.setTotalConnections(poolMXBean.getTotalConnections());
            metrics.setThreadsAwaitingConnection(poolMXBean.getThreadsAwaitingConnection());
        }

        metrics.setCacheSize(redisCacheService.getCacheSize());

        return metrics;
    }

    public static class PerformanceMetrics {
        private int activeConnections;
        private int idleConnections;
        private int totalConnections;
        private int threadsAwaitingConnection;
        private long cacheSize;

        public int getActiveConnections() {
            return activeConnections;
        }

        public void setActiveConnections(int activeConnections) {
            this.activeConnections = activeConnections;
        }

        public int getIdleConnections() {
            return idleConnections;
        }

        public void setIdleConnections(int idleConnections) {
            this.idleConnections = idleConnections;
        }

        public int getTotalConnections() {
            return totalConnections;
        }

        public void setTotalConnections(int totalConnections) {
            this.totalConnections = totalConnections;
        }

        public int getThreadsAwaitingConnection() {
            return threadsAwaitingConnection;
        }

        public void setThreadsAwaitingConnection(int threadsAwaitingConnection) {
            this.threadsAwaitingConnection = threadsAwaitingConnection;
        }

        public long getCacheSize() {
            return cacheSize;
        }

        public void setCacheSize(long cacheSize) {
            this.cacheSize = cacheSize;
        }

        public double getPoolUtilization() {
            if (totalConnections > 0) {
                return (double) activeConnections / totalConnections * 100;
            }
            return 0;
        }
    }
}
