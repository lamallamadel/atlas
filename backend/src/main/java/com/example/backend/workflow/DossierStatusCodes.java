package com.example.backend.workflow;

import com.example.backend.entity.enums.DossierStatus;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

/**
 * Correspondance entre l'ancien enum {@link DossierStatus} et les codes de statut de la
 * nomenclature (ADR 0004, phase A).
 *
 * <p>Pendant la migration, l'enum reste écrit par le code existant ; le {@code status_code} du
 * dossier en est dérivé ici. Les phases B et C feront du {@code status_code} la seule vérité.
 */
public final class DossierStatusCodes {

    public static final String DEFAULT_CASE_TYPE = "CRM_LEAD";

    public static final String CRM_NEW = "CRM_NEW";
    public static final String CRM_QUALIFYING = "CRM_QUALIFYING";
    public static final String CRM_QUALIFIED = "CRM_QUALIFIED";
    public static final String CRM_VISIT_PLANNED = "CRM_VISIT_PLANNED";
    public static final String CRM_CLOSED_WON = "CRM_CLOSED_WON";
    public static final String CRM_CLOSED_LOST = "CRM_CLOSED_LOST";

    private static final Map<DossierStatus, String> TO_CODE = new EnumMap<>(DossierStatus.class);

    static {
        TO_CODE.put(DossierStatus.NEW, CRM_NEW);
        TO_CODE.put(DossierStatus.QUALIFYING, CRM_QUALIFYING);
        TO_CODE.put(DossierStatus.QUALIFIED, CRM_QUALIFIED);
        TO_CODE.put(DossierStatus.APPOINTMENT, CRM_VISIT_PLANNED);
        TO_CODE.put(DossierStatus.WON, CRM_CLOSED_WON);
        TO_CODE.put(DossierStatus.LOST, CRM_CLOSED_LOST);
    }

    private DossierStatusCodes() {}

    /** Code de nomenclature correspondant à un statut de l'enum ({@code null} si {@code null}). */
    public static String toCode(DossierStatus status) {
        return status == null ? null : TO_CODE.get(status);
    }

    /** Statut de l'enum correspondant à un code, s'il en existe un. */
    public static Optional<DossierStatus> toEnum(String code) {
        if (code == null) {
            return Optional.empty();
        }
        for (Map.Entry<DossierStatus, String> e : TO_CODE.entrySet()) {
            if (e.getValue().equals(code)) {
                return Optional.of(e.getKey());
            }
        }
        return Optional.empty();
    }

    /**
     * Ramène une valeur reçue (nom d'enum hérité comme {@code NEW}, ou code) au code de
     * nomenclature. Une valeur inconnue est renvoyée telle quelle.
     */
    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        for (DossierStatus s : DossierStatus.values()) {
            if (s.name().equals(value)) {
                return TO_CODE.get(s);
            }
        }
        return value;
    }

    /** Type de dossier effectif : le type par défaut quand il est absent. */
    public static String effectiveCaseType(String caseType) {
        return caseType == null || caseType.isBlank() ? DEFAULT_CASE_TYPE : caseType;
    }

    /**
     * Projection sur l'ancien enum d'un code de statut (ADR 0004, phase B) : la correspondance
     * directe pour les codes {@code CRM_*} du pipeline historique, sinon d'après la sémantique de
     * l'état (issue et étape de l'entonnoir). Sert aux écrans et rapports qui lisent encore l'enum.
     */
    public static DossierStatus project(String code, DossierWorkflow.State state) {
        Optional<DossierStatus> direct = toEnum(code);
        if (direct.isPresent()) {
            return direct.get();
        }
        if (state == null) {
            return DossierStatus.NEW;
        }
        return switch (state.stage()) {
            case WON -> DossierStatus.WON;
            case LOST -> DossierStatus.LOST;
            case OPEN ->
                    switch (state.funnelStep()) {
                        case NEW -> DossierStatus.NEW;
                        case QUALIFICATION -> DossierStatus.QUALIFIED;
                        case VISIT, OFFER, CLOSING -> DossierStatus.APPOINTMENT;
                    };
        };
    }
}
