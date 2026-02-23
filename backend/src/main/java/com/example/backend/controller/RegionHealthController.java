package com.example.backend.controller;

import com.example.backend.config.MultiRegionConfig;
import com.example.backend.service.DatabaseReplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/region")
public class RegionHealthController {

    @Autowired
    private MultiRegionConfig multiRegionConfig;

    @Autowired
    private DatabaseReplicationService replicationService;

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentRegion() {
        Map<String, Object> response = new HashMap<>();
        response.put("region", multiRegionConfig.getCurrentRegion());
        response.put("replicationEnabled", multiRegionConfig.isReplicationEnabled());

        MultiRegionConfig.RegionConfig currentRegion =
            multiRegionConfig.getRegions().get(multiRegionConfig.getCurrentRegion());

        if (currentRegion != null) {
            response.put("isPrimary", currentRegion.isPrimary());
            response.put("endpoint", currentRegion.getEndpoint());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, MultiRegionConfig.RegionConfig>> getAllRegions() {
        return ResponseEntity.ok(multiRegionConfig.getRegions());
    }

    @GetMapping("/replication/status")
    public ResponseEntity<Map<String, Object>> getReplicationStatus() {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Map<String, Object>> slots = replicationService.getReplicationStatus();
            List<Map<String, Object>> subscriptions = replicationService.getSubscriptionStatus();

            response.put("replicationSlots", slots);
            response.put("subscriptions", subscriptions);
            response.put("status", "healthy");
        } catch (Exception e) {
            response.put("status", "error");
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/replication/setup-subscription")
    public ResponseEntity<Map<String, String>> setupSubscription(
            @RequestParam String remoteRegion,
            @RequestParam String connectionString) {

        try {
            replicationService.createSubscriptionToRemoteRegion(remoteRegion, connectionString);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Subscription created to " + remoteRegion);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getRegionHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("region", multiRegionConfig.getCurrentRegion());
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(health);
    }
}
