package com.example.backend.entitlement;

import java.util.Arrays;
import java.util.Optional;

/**
 * Catalogue des modules d'une agence (spec {@code 05_feature_flags_plans.md}). Les clés {@code
 * core.*} sont le socle : toujours actives. Les autres sont activées par défaut ; le super-admin
 * peut les désactiver agence par agence (table {@code feature_flag}). Celles marquées {@code
 * enforced} sont bloquées côté API ({@link RequiresFeature}) quand elles sont désactivées.
 */
public enum Feature {
    CORE_IDENTITY("core.identity", "Identité et rôles", false),
    CORE_ANNONCE("core.annonce", "Annonces", false),
    CORE_SEARCH("core.search", "Recherche", false),
    CORE_DOSSIER("core.dossier", "Dossiers (CRM)", false),
    CORE_RDV("core.rdv", "Rendez-vous", false),
    CORE_TIMELINE("core.timeline", "Messages et fil d'activité", false),
    CORE_AUDIT("core.audit", "Audit", false),
    CORE_CONSENT("core.consent", "Consentements", false),

    MODULE_TRUST_BASIC("module.trust.basic", "Confiance : doublons et modération", false),
    MODULE_NEUF("module.neuf", "Neuf : programmes et lots", true),
    MODULE_COOP_HABITAT("module.coop_habitat", "Coop habitat", true),
    MODULE_MANDATE_MARKETPLACE("module.mandate_marketplace", "Bourse aux mandats", true),

    ADDON_EXPORT("addon.export", "Export des leads", true),
    ADDON_ESIGN("addon.esign", "Signature électronique", true),
    ADDON_REPORTING_PLUS("addon.reporting_plus", "Reporting avancé", false),
    ADDON_INTEGRATIONS("addon.integrations", "Intégrations", false);

    private final String key;
    private final String label;
    private final boolean enforced;

    Feature(String key, String label, boolean enforced) {
        this.key = key;
        this.label = label;
        this.enforced = enforced;
    }

    public String key() {
        return key;
    }

    public String label() {
        return label;
    }

    /** Bloqué côté API quand désactivé. */
    public boolean enforced() {
        return enforced;
    }

    /** Socle : ne peut pas être désactivé. */
    public boolean core() {
        return key.startsWith("core.");
    }

    public static Optional<Feature> fromKey(String key) {
        return Arrays.stream(values()).filter(f -> f.key.equals(key)).findFirst();
    }
}
