package com.example.backend.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MetricsService {

    private final MeterRegistry registry;

    private final Map<String, Counter> counterCache = new ConcurrentHashMap<>();
    private final Map<String, Timer> timerCache = new ConcurrentHashMap<>();

    public MetricsService(MeterRegistry registry) {
        this.registry = registry;
    }

    public void incrementDossierCreated(String source) {
        String s = normalize(source);
        counter("dossier_created_total", "source", s).increment();
    }

    public void incrementDossierStatusTransition(String from, String to) {
        counter("dossier_status_transitions_total", "from", normalize(from), "to", normalize(to)).increment();
    }

    public void incrementAnnonceView(String status) {
        counter("annonce_views_total", "status", normalize(status)).increment();
    }

    public void incrementAppointmentsCreated() {
        counter("appointments_created_total").increment();
    }

    public void incrementAppointmentsCompleted() {
        counter("appointments_completed_total").increment();
    }

    public void recordAppointmentDurationSeconds(long seconds) {
        if (seconds < 0) return;
        timer("appointment_duration_seconds").record(Duration.ofSeconds(seconds));
    }

    public void incrementNotificationSent(String type, String status) {
        counter("notification_sent_total", "type", normalize(type), "status", normalize(status)).increment();
    }

    private Counter counter(String name, String... tags) {
        String key = name + "|" + String.join("|", tags);
        return counterCache.computeIfAbsent(key, k -> Counter.builder(name).tags(tags).register(registry));
    }

    private Timer timer(String name, String... tags) {
        String key = name + "|" + String.join("|", tags);
        return timerCache.computeIfAbsent(key, k -> Timer.builder(name).tags(tags).register(registry));
    }

    private static String normalize(String v) {
        if (v == null || v.isBlank()) return "UNKNOWN";
        return v.trim();
    }
}
