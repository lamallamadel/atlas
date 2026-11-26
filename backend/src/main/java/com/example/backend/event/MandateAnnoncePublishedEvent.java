package com.example.backend.event;

/** Une annonce publiée par une agence sous mandat (lot B) vient d'être mise en ligne. */
public record MandateAnnoncePublishedEvent(Long annonceId, Long mandateId, String orgId) {}
