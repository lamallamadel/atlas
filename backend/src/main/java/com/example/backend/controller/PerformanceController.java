package com.example.backend.controller;

import com.example.backend.performance.PerformanceMonitoringService;
import com.example.backend.performance.RedisCacheService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.backend.util.DatabaseIndexAudit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/performance")
@ConditionalOnProperty(name = "performance.monitoring.enabled", havingValue = "true", matchIfMissing = true)
public class PerformanceController {

    private final PerformanceMonitoringService performanceMonitoring;
    private final RedisCacheService cacheService;

    public PerformanceController(PerformanceMonitoringService performanceMonitoring,
            RedisCacheService cacheService) {
        this.performanceMonitoring = performanceMonitoring;
        this.cacheService = cacheService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        PerformanceMonitoringService.PerformanceMetrics metrics = performanceMonitoring.getCurrentMetrics();

        Map<String, Object> response = new HashMap<>();

        Map<String, Object> connectionPool = new HashMap<>();
        connectionPool.put("activeConnections", metrics.getActiveConnections());
        connectionPool.put("idleConnections", metrics.getIdleConnections());
        connectionPool.put("totalConnections", metrics.getTotalConnections());
        connectionPool.put("utilizationPercent", metrics.getPoolUtilization());
        connectionPool.put("threadsAwaitingConnection", metrics.getThreadsAwaitingConnection());

        Map<String, Object> cache = new HashMap<>();
        cache.put("totalKeys", metrics.getCacheSize());

        response.put("connectionPool", connectionPool);
        response.put("cache", cache);
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/cache/invalidate")
    public ResponseEntity<Map<String, String>> invalidateCache() {
        long beforeSize = cacheService.getCacheSize();
        cacheService.invalidateAll();
        long afterSize = cacheService.getCacheSize();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Cache invalidated successfully");
        response.put("keysRemoved", String.valueOf(beforeSize - afterSize));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Long>> getCacheStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalKeys", cacheService.getCacheSize());

        return ResponseEntity.ok(stats);
    }
}
