package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** Visite planifiée par l'agent à partir de la réponse du client (créneau modifiable). */
public record VisitPlanRequest(
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime,
        @Size(max = 500) String location,
        @Size(max = 2000) String notes) {}
