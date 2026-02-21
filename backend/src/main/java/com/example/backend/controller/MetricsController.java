package com.example.backend.controller;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final MeterRegistry meterRegistry;

    public MetricsController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * Résumé "admin" des métriques importantes. - Counters (count) - Timers (count, totalTimeMs,
     * meanMs, maxMs) - Gauges (value)
     *
     * <p>Note: ce endpoint n'est pas un remplacement de /actuator/prometheus.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getMetricsSummary() {

        // Ajustez la sélection si vous voulez limiter davantage (éviter des payloads trop gros)
        Set<String> allowPrefixes =
                Set.of(
                        "dossier_",
                        "annonce_",
                        "appointments_",
                        "notification_",
                        "http.server.requests",
                        "hikaricp",
                        "jvm",
                        "process",
                        "system",
                        "tomcat",
                        "spring");

        List<Meter> meters =
                meterRegistry.getMeters().stream()
                        .filter(m -> isAllowed(m.getId().getName(), allowPrefixes))
                        .sorted(Comparator.comparing(m -> m.getId().getName()))
                        .collect(Collectors.toList());

        List<Map<String, Object>> counters = new ArrayList<>();
        List<Map<String, Object>> timers = new ArrayList<>();
        List<Map<String, Object>> gauges = new ArrayList<>();

        for (Meter m : meters) {
            Meter.Id id = m.getId();
            String name = id.getName();

            if (m instanceof Counter c) {
                counters.add(counterToMap(c, id));
            } else if (m instanceof Timer t) {
                timers.add(timerToMap(t, id));
            } else if (m instanceof Gauge g) {
                gauges.add(gaugeToMap(g, id));
            } else {
                // Certains meters (DistributionSummary, LongTaskTimer, etc.) peuvent être ajoutés
                // ici si besoin.
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put(
                "counts",
                Map.of(
                        "counters", counters.size(),
                        "timers", timers.size(),
                        "gauges", gauges.size()));
        payload.put("counters", counters);
        payload.put("timers", timers);
        payload.put("gauges", gauges);

        // Ajout d’un mini “highlights” utile (optionnel)
        payload.put("highlights", computeHighlights());

        return ResponseEntity.ok(payload);
    }

    private static boolean isAllowed(String metricName, Set<String> allowPrefixes) {
        if (!StringUtils.hasText(metricName)) return false;
        for (String p : allowPrefixes) {
            if (metricName.equals(p) || metricName.startsWith(p)) return true;
        }
        return false;
    }

    private static Map<String, Object> counterToMap(Counter c, Meter.Id id) {
        Map<String, Object> m = base(id);
        m.put("count", c.count());
        return m;
    }

    private static Map<String, Object> timerToMap(Timer t, Meter.Id id) {
        Map<String, Object> m = base(id);
        m.put("count", t.count());
        m.put("totalTimeMs", t.totalTime(TimeUnit.MILLISECONDS));
        m.put("meanMs", t.mean(TimeUnit.MILLISECONDS));
        m.put("maxMs", t.max(TimeUnit.MILLISECONDS));
        return m;
    }

    private static Map<String, Object> gaugeToMap(Gauge g, Meter.Id id) {
        Map<String, Object> m = base(id);
        Double v = g.value();
        // Evite NaN/Infinity côté JSON
        if (v == null || v.isNaN() || v.isInfinite()) {
            m.put("value", null);
        } else {
            m.put("value", v);
        }
        return m;
    }

    private static Map<String, Object> base(Meter.Id id) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", id.getName());

        Map<String, String> tags =
                id.getTags().stream()
                        .collect(
                                Collectors.toMap(
                                        io.micrometer.core.instrument.Tag::getKey,
                                        io.micrometer.core.instrument.Tag::getValue,
                                        (a, b) -> b,
                                        LinkedHashMap::new));
        m.put("tags", tags);

        String desc = id.getDescription();
        if (StringUtils.hasText(desc)) {
            m.put("description", desc);
        }

        String baseUnit = id.getBaseUnit();
        if (StringUtils.hasText(baseUnit)) {
            m.put("baseUnit", baseUnit);
        }
        return m;
    }

    /**
     * Highlights optionnels, pour avoir 2-3 points de contrôle rapide. Ici : un état Hikari si
     * présent (active/idle/total/pending).
     */
    private Map<String, Object> computeHighlights() {
        Map<String, Object> h = new LinkedHashMap<>();

        // Hikari (si datasource présente)
        h.put(
                "hikari",
                Map.of(
                        "active", readGauge("hikaricp.connections.active"),
                        "idle", readGauge("hikaricp.connections.idle"),
                        "pending", readGauge("hikaricp.connections.pending"),
                        "total", readGauge("hikaricp.connections")));

        // HTTP (si dispo)
        h.put(
                "http",
                Map.of(
                        "serverRequestsCount", readTimerCount("http.server.requests"),
                        "serverRequestsMeanMs", readTimerMeanMs("http.server.requests")));

        return h;
    }

    private Double readGauge(String name) {
        try {
            Gauge g = meterRegistry.find(name).gauge();
            if (g == null) return null;
            double v = g.value();
            if (Double.isNaN(v) || Double.isInfinite(v)) return null;
            return v;
        } catch (Exception e) {
            return null;
        }
    }

    private Long readTimerCount(String name) {
        try {
            Timer t = meterRegistry.find(name).timer();
            return t != null ? t.count() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Double readTimerMeanMs(String name) {
        try {
            Timer t = meterRegistry.find(name).timer();
            if (t == null) return null;
            double v = t.mean(TimeUnit.MILLISECONDS);
            if (Double.isNaN(v) || Double.isInfinite(v)) return null;
            return v;
        } catch (Exception e) {
            return null;
        }
    }
}
