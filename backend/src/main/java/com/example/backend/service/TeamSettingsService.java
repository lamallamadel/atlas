package com.example.backend.service;

import com.example.backend.entity.OrganizationSettings;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.security.AccessPolicy;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Réglages d'équipe d'une agence, rangés dans {@code organization_settings.settings.team}. {@code
 * restrictAgentsToOwnDossiers} (désactivé par défaut) et {@code leadRouting}, la distribution des
 * leads du portail ({@code SHARED_QUEUE} par défaut, cf. {@link LeadRoutingService}).
 *
 * <p>Lu à chaque requête d'un agent : la valeur est gardée en mémoire {@value #TTL_SECONDS}
 * secondes par instance. Un changement prend donc effet au plus tard après ce délai sur les autres
 * instances.
 */
@Service
public class TeamSettingsService {

    private static final Logger log = LoggerFactory.getLogger(TeamSettingsService.class);
    static final long TTL_SECONDS = 30;
    static final String SECTION = "team";
    static final String RESTRICT_KEY = "restrictAgentsToOwnDossiers";
    static final String ROUTING_KEY = "leadRouting";

    public record TeamSettings(
            boolean restrictAgentsToOwnDossiers, LeadRoutingService.Mode leadRouting) {}

    private record Cached(boolean value, Instant until) {}

    private final OrganizationSettingsRepository repository;
    @Nullable private final CacheManager cacheManager;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public TeamSettingsService(
            OrganizationSettingsRepository repository, @Nullable CacheManager cacheManager) {
        this.repository = repository;
        this.cacheManager = cacheManager;
    }

    /** Les agents de l'agence sont-ils limités à leurs dossiers ? */
    @Transactional(readOnly = true)
    public boolean restrictAgents(String orgId) {
        Cached cached = cache.get(orgId);
        if (cached != null && cached.until().isAfter(Instant.now())) {
            return cached.value();
        }
        boolean value =
                repository.findByOrgId(orgId).map(s -> readRestrict(s.getSettings())).orElse(false);
        cache.put(orgId, new Cached(value, Instant.now().plus(Duration.ofSeconds(TTL_SECONDS))));
        return value;
    }

    /** Distribution des leads (lu à chaque lead, sans cache : rare). */
    @Transactional(readOnly = true)
    public LeadRoutingService.Mode leadRouting(String orgId) {
        return repository
                .findByOrgId(orgId)
                .map(s -> readRouting(s.getSettings()))
                .orElse(LeadRoutingService.Mode.SHARED_QUEUE);
    }

    @Transactional(readOnly = true)
    public TeamSettings get(String orgId) {
        return new TeamSettings(restrictAgents(orgId), leadRouting(orgId));
    }

    /** Réservé à l'administrateur de l'agence. */
    @Transactional
    public TeamSettings update(String orgId, boolean restrictAgentsToOwnDossiers) {
        return update(orgId, restrictAgentsToOwnDossiers, null);
    }

    /** Réservé à l'administrateur de l'agence. {@code null} laisse le réglage inchangé. */
    @Transactional
    public TeamSettings update(
            String orgId,
            @Nullable Boolean restrictAgentsToOwnDossiers,
            @Nullable LeadRoutingService.Mode leadRouting) {
        AccessPolicy.requireCanManageTeam();
        OrganizationSettings entity =
                repository
                        .findByOrgId(orgId)
                        .orElseGet(
                                () -> {
                                    OrganizationSettings created = new OrganizationSettings();
                                    created.setOrgId(orgId);
                                    return created;
                                });
        Map<String, Object> settings =
                entity.getSettings() == null
                        ? new HashMap<>()
                        : new HashMap<>(entity.getSettings());
        Map<String, Object> team = new HashMap<>();
        if (settings.get(SECTION) instanceof Map<?, ?> existing) {
            existing.forEach((k, v) -> team.put(String.valueOf(k), v));
        }
        if (restrictAgentsToOwnDossiers != null) {
            team.put(RESTRICT_KEY, restrictAgentsToOwnDossiers);
        }
        if (leadRouting != null) {
            team.put(ROUTING_KEY, leadRouting.name());
        }
        settings.put(SECTION, team);
        entity.setSettings(settings);
        repository.save(entity);

        cache.remove(orgId);
        evictOrganizationSettingsCache();
        TeamSettings result = new TeamSettings(readRestrict(settings), readRouting(settings));
        log.info(
                "Team settings updated: org={} restrictAgentsToOwnDossiers={} leadRouting={}",
                orgId,
                result.restrictAgentsToOwnDossiers(),
                result.leadRouting());
        return result;
    }

    static LeadRoutingService.Mode readRouting(Map<String, Object> settings) {
        if (settings != null
                && settings.get(SECTION) instanceof Map<?, ?> team
                && team.get(ROUTING_KEY) instanceof String v) {
            try {
                return LeadRoutingService.Mode.valueOf(v);
            } catch (IllegalArgumentException ignored) {
                // valeur inconnue : file partagée
            }
        }
        return LeadRoutingService.Mode.SHARED_QUEUE;
    }

    static boolean readRestrict(Map<String, Object> settings) {
        if (settings != null && settings.get(SECTION) instanceof Map<?, ?> team) {
            return Boolean.TRUE.equals(team.get(RESTRICT_KEY));
        }
        return false;
    }

    private void evictOrganizationSettingsCache() {
        if (cacheManager == null) {
            return;
        }
        Cache settingsCache = cacheManager.getCache("organizationSettings");
        if (settingsCache != null) {
            settingsCache.clear();
        }
    }
}
