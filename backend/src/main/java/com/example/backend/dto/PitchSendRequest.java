package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Message validé par l'agent, à envoyer au client acheteur. */
public record PitchSendRequest(
        @NotBlank @Size(max = 1000) String message, @NotNull String channel, String language) {}
