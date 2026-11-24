package com.example.backend.entitlement;

import com.example.backend.entity.FeatureFlagEntity;
import com.example.backend.repository.FeatureFlagRepository;
import com.example.backend.util.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Modules d'une agence ({@code Entitlements.check} de la spec). Sans ligne dans {@code
 * feature_flag}, un module est actif : les agences existantes ne perdent rien ; le super-admin
 * désactive au cas par cas. Le socle {@code core.*} est toujours actif.
 *
 * <p>Lu à chaque requête protégée : gardé en mémoire {@value #TTL_SECONDS} secondes par instance.
 */
@Service
public class EntitlementService {

    private static final Logger log = LoggerFactory.getLogger(EntitlementService.class);
    static final long TTL_SECONDS = 30;

    /** État d'un module pour une agence. */
    public record FeatureStatus(
            String key, String label, boolean enabled, boolean core, boolean enforced) {}

    private record Cached(Map<String, Boolean> flags, Instant until) {}

    private final FeatureFlagRepository repository;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public EntitlementService(FeatureFlagRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String orgId, Feature feature) {
        if (feature.core() || orgId == null || orgId.isBlank()) {
            return true;
        }
        return flags(orgId).getOrDefault(feature.key(), true);
    }

    /** Lève {@link FeatureDisabledException} si l'agence courante n'a pas ce module. */
    @Transactional(readOnly = true)
    public void require(Feature feature) {
        String orgId = TenantContext.getOrgId();
        if (!isEnabled(orgId, feature)) {
            throw new FeatureDisabledException(feature);
        }
    }

    /** Catalogue complet avec l'état pour l'agence. */
    @Transactional(readOnly = true)
    public List<FeatureStatus> list(String orgId) {
        List<FeatureStatus> result = new ArrayList<>();
        for (Feature f : Feature.values()) {
            result.add(
                    new FeatureStatus(
                            f.key(), f.label(), isEnabled(orgId, f), f.core(), f.enforced()));
        }
        return result;
    }

    /**
     * Lignes {@code feature_flag} de l'agence, complétées par les modules du catalogue qui n'en ont
     * pas (non persistées, actives) : c'est ce que voit l'écran d'administration.
     */
    @Transactional(readOnly = true)
    public List<FeatureFlagEntity> adminView(String orgId) {
        List<FeatureFlagEntity> rows = new ArrayList<>(repository.findByOrgId(orgId));
        for (Feature f : Feature.values()) {
            if (!f.core() && rows.stream().noneMatch(r -> f.key().equals(r.getFeatureKey()))) {
                rows.add(newRow(orgId, f, true));
            }
        }
        return rows;
    }

    /**
     * Active ou désactive un module pour une agence (super-admin). Crée la ligne pour un module du
     * catalogue ; une ancienne clé hors catalogue doit déjà exister. Le socle est refusé.
     */
    @Transactional
    public FeatureFlagEntity setEnabled(String orgId, String key, boolean enabled) {
        Feature feature = Feature.fromKey(key).orElse(null);
        if (feature != null && feature.core()) {
            throw new IllegalArgumentException(
                    "CORE_FEATURE: le socle (" + key + ") ne peut pas être désactivé.");
        }
        FeatureFlagEntity row =
                repository
                        .findByOrgIdAndFeatureKey(orgId, key)
                        .orElseGet(
                                () -> {
                                    if (feature == null) {
                                        throw new IllegalArgumentException(
                                                "Feature not found: " + key);
                                    }
                                    return newRow(orgId, feature, enabled);
                                });
        row.setEnabled(enabled);
        row.setUpdatedAt(LocalDateTime.now());
        FeatureFlagEntity saved = repository.save(row);
        cache.remove(orgId);
        log.info("Feature {} {} for org {}", key, enabled ? "enabled" : "disabled", orgId);
        return saved;
    }

    private Map<String, Boolean> flags(String orgId) {
        Cached cached = cache.get(orgId);
        if (cached != null && cached.until().isAfter(Instant.now())) {
            return cached.flags();
        }
        Map<String, Boolean> flags = new HashMap<>();
        for (FeatureFlagEntity row : repository.findByOrgId(orgId)) {
            flags.put(row.getFeatureKey(), !Boolean.FALSE.equals(row.getEnabled()));
        }
        cache.put(orgId, new Cached(flags, Instant.now().plus(Duration.ofSeconds(TTL_SECONDS))));
        return flags;
    }

    private static FeatureFlagEntity newRow(String orgId, Feature feature, boolean enabled) {
        FeatureFlagEntity row = new FeatureFlagEntity();
        row.setOrgId(orgId);
        row.setFeatureKey(feature.key());
        row.setFeatureName(feature.label());
        row.setEnabled(enabled);
        LocalDateTime now = LocalDateTime.now();
        row.setCreatedAt(now);
        row.setUpdatedAt(now);
        return row;
    }
}
