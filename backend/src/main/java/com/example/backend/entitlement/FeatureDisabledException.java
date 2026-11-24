package com.example.backend.entitlement;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Module non inclus pour l'agence : 403, avec la clé du module. */
public class FeatureDisabledException extends ResponseStatusException {

    private final Feature feature;

    public FeatureDisabledException(Feature feature) {
        super(
                HttpStatus.FORBIDDEN,
                "FEATURE_DISABLED: le module « "
                        + feature.label()
                        + " » n'est pas activé pour votre agence ("
                        + feature.key()
                        + ").");
        this.feature = feature;
    }

    public Feature getFeature() {
        return feature;
    }
}
