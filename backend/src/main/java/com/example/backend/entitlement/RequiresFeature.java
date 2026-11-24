package com.example.backend.entitlement;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Le contrôleur (ou la méthode) n'est accessible que si l'agence de la requête a ce module : sinon
 * 403 {@code FEATURE_DISABLED}. Vérifié par {@link RequiresFeatureInterceptor} ; une annotation sur
 * la méthode remplace celle de la classe.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresFeature {
    Feature value();
}
