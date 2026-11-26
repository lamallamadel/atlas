package com.example.backend.mandate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Réglages de la bourse aux mandats (R-PROP-07, R-PROP-11, R-PROP-16, cycle du mandat). */
@Component
public class MarketplaceSettings {

    private final int maxProposals;
    private final int requestDays;
    private final int directResponseHours;
    private final int monthlyProposalQuota;
    private final int pendingSignatureDays;

    public MarketplaceSettings(
            @Value("${atlas.marketplace.max-proposals:5}") int maxProposals,
            @Value("${atlas.marketplace.request-days:14}") int requestDays,
            @Value("${atlas.marketplace.direct-response-hours:72}") int directResponseHours,
            @Value("${atlas.marketplace.monthly-proposal-quota:30}") int monthlyProposalQuota,
            @Value("${atlas.marketplace.pending-signature-days:7}") int pendingSignatureDays) {
        this.maxProposals = maxProposals;
        this.requestDays = requestDays;
        this.directResponseHours = directResponseHours;
        this.monthlyProposalQuota = monthlyProposalQuota;
        this.pendingSignatureDays = pendingSignatureDays;
    }

    public int maxProposals() {
        return maxProposals;
    }

    public int requestDays() {
        return requestDays;
    }

    public int directResponseHours() {
        return directResponseHours;
    }

    public int monthlyProposalQuota() {
        return monthlyProposalQuota;
    }

    public int pendingSignatureDays() {
        return pendingSignatureDays;
    }
}
