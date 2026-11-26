package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.entity.PropertyEntity;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Compatibilité acquéreur ↔ bien utilisée pour le compteur « acquéreurs compatibles » (§ 5.2). */
class MandateMatchingServiceTest {

    private static DossierSearchCriteria criteria(
            List<String> tx,
            List<String> cats,
            List<String> cities,
            String min,
            String max,
            Double sMin,
            Double sMax) {
        return new DossierSearchCriteria(
                tx,
                cats,
                cities,
                min == null ? null : new BigDecimal(min),
                max == null ? null : new BigDecimal(max),
                sMin,
                sMax,
                null,
                null,
                null);
    }

    private static PropertyEntity property(String type, Double surface) {
        PropertyEntity p = new PropertyEntity();
        p.setPropertyType(type);
        p.setSurface(surface);
        return p;
    }

    private static boolean matches(DossierSearchCriteria c) {
        return MandateMatchingService.matches(
                c, "SALE", "Tanger", property("Appartement", 92.0), new BigDecimal("1450000"));
    }

    @Test
    void emptyCriteriaMatch() {
        assertThat(matches(criteria(null, null, null, null, null, null, null))).isTrue();
    }

    @Test
    void transactionCityAndTypeMustMatch_caseInsensitive() {
        assertThat(
                        matches(
                                criteria(
                                        List.of("sale"),
                                        List.of("appartement"),
                                        List.of(" tanger "),
                                        null,
                                        null,
                                        null,
                                        null)))
                .isTrue();
        assertThat(matches(criteria(List.of("RENT"), null, null, null, null, null, null)))
                .isFalse();
        assertThat(matches(criteria(null, null, List.of("Rabat"), null, null, null, null)))
                .isFalse();
        assertThat(matches(criteria(null, List.of("Villa"), null, null, null, null, null)))
                .isFalse();
    }

    @Test
    void budgetHasTenPercentHeadroomAboveAndTwentyBelow() {
        // 1 450 000 ≤ 1 320 000 × 1,10 = 1 452 000
        assertThat(matches(criteria(null, null, null, null, "1320000", null, null))).isTrue();
        assertThat(matches(criteria(null, null, null, null, "1300000", null, null))).isFalse();
        // 1 450 000 ≥ 1 800 000 × 0,80 = 1 440 000
        assertThat(matches(criteria(null, null, null, "1800000", null, null, null))).isTrue();
        assertThat(matches(criteria(null, null, null, "1850000", null, null, null))).isFalse();
    }

    @Test
    void surfaceHasTenPercentTolerance() {
        assertThat(matches(criteria(null, null, null, null, null, 100.0, null))).isTrue();
        assertThat(matches(criteria(null, null, null, null, null, 110.0, null))).isFalse();
        assertThat(matches(criteria(null, null, null, null, null, null, 84.0))).isTrue();
        assertThat(matches(criteria(null, null, null, null, null, null, 80.0))).isFalse();
    }
}
