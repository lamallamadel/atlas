package com.example.backend.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Critères de recherche d'un acheteur ou locataire. Tous facultatifs ; seuls les critères
 * renseignés comptent dans le matching.
 *
 * @param transactionTypes SALE, RENT, LEASE, EXCHANGE
 * @param categories APARTMENT, HOUSE, STUDIO, COMMERCIAL
 * @param furnished null = indifférent
 * @param equipments équipements souhaités (piscine, parking, vue mer, ...)
 * @param acceptedConditions états acceptés : neuf, bon_etat, a_rafraichir, a_renover
 */
public record DossierSearchCriteria(
        @Size(max = 4) List<String> transactionTypes,
        @Size(max = 10) List<String> categories,
        @Size(max = 20) List<@Size(max = 100) String> cities,
        @PositiveOrZero BigDecimal budgetMin,
        @PositiveOrZero BigDecimal budgetMax,
        @PositiveOrZero Double surfaceMin,
        @PositiveOrZero Double surfaceMax,
        Boolean furnished,
        @Size(max = 20) List<@Size(max = 60) String> equipments,
        @Size(max = 4) List<String> acceptedConditions) {

    public boolean isEmpty() {
        return isEmpty(transactionTypes)
                && isEmpty(categories)
                && isEmpty(cities)
                && budgetMin == null
                && budgetMax == null
                && surfaceMin == null
                && surfaceMax == null
                && furnished == null
                && isEmpty(equipments)
                && isEmpty(acceptedConditions);
    }

    private static boolean isEmpty(List<?> l) {
        return l == null || l.isEmpty();
    }
}
