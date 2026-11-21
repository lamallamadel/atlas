package com.example.backend.dto;

import java.time.LocalDateTime;

/** Lien à transmettre au client ; il n'est affiché qu'une fois (seule son empreinte est gardée). */
public record ConsentLinkResponse(
        Long requestId, String url, String channel, String consentType, LocalDateTime expiresAt) {}
