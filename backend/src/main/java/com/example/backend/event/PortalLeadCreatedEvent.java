package com.example.backend.event;

/** Un contact est arrivé par le portail ou la vitrine (après enregistrement du consentement). */
public record PortalLeadCreatedEvent(Long dossierId, String orgId) {}
