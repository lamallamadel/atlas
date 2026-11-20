package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rendez-vous de visite créé.
 *
 * @param warnings chevauchements avec d'autres rendez-vous de l'agent
 */
public record VisitPlanResponse(
        Long appointmentId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        List<String> warnings) {}
