package com.example.backend.entitlement;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Exempte une méthode du {@link RequiresFeature} de sa classe : rappel d'un prestataire (ex.
 * webhook de signature) qui doit aboutir même si l'agence a perdu le module entre-temps.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface SkipFeatureCheck {}
