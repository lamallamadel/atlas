package com.example.backend.controller;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/metrics")
public class LatencyMetricsController {

    private static final Logger logger = LoggerFactory.getLogger(LatencyMetricsController.class);

    @Autowired private MeterRegistry meterRegistry;

    private final Map<String, Timer> latencyTimers = new ConcurrentHashMap<>();

    @PostMapping("/latency")
    public ResponseEntity<Map<String, String>> recordLatency(@RequestBody LatencyMetric metric) {
        try {
            String timerName = "cross.region.latency";

            Timer timer =
                    latencyTimers.computeIfAbsent(
                            metric.getRegion(),
                            region ->
                                    Timer.builder(timerName)
                                            .tag("region", region)
                                            .tag("metric_type", metric.getMetric())
                                            .description("Cross-region API latency")
                                            .publishPercentileHistogram()
                                            .minimumExpectedValue(Duration.ofMillis(10))
                                            .maximumExpectedValue(Duration.ofSeconds(5))
                                            .register(meterRegistry));

            timer.record(metric.getLatency().longValue(), TimeUnit.MILLISECONDS);

            if (metric.getLatency() > 200) {
                logger.warn(
                        "High latency detected: {}ms for region {} ({})",
                        metric.getLatency(),
                        metric.getRegion(),
                        metric.getMetric());

                meterRegistry
                        .counter(
                                "high.latency.events",
                                "region",
                                metric.getRegion(),
                                "threshold",
                                "200ms")
                        .increment();
            }

            Map<String, String> response = new HashMap<>();
            response.put("status", "recorded");
            response.put("region", metric.getRegion());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to record latency metric", e);

            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/latency/stats")
    public ResponseEntity<Map<String, Object>> getLatencyStats(@RequestParam String region) {
        Map<String, Object> stats = new HashMap<>();

        Timer timer = latencyTimers.get(region);

        if (timer != null) {
            stats.put("region", region);
            stats.put("count", timer.count());
            stats.put("mean", timer.mean(TimeUnit.MILLISECONDS));
            stats.put("max", timer.max(TimeUnit.MILLISECONDS));
            stats.put("totalTime", timer.totalTime(TimeUnit.MILLISECONDS));
        } else {
            stats.put("region", region);
            stats.put("message", "No data available");
        }

        return ResponseEntity.ok(stats);
    }

    public static class LatencyMetric {
        private String metric;
        private String region;
        private Double latency;
        private String timestamp;

        public String getMetric() {
            return metric;
        }

        public void setMetric(String metric) {
            this.metric = metric;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public Double getLatency() {
            return latency;
        }

        public void setLatency(Double latency) {
            this.latency = latency;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}
