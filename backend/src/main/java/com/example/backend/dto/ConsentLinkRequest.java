package com.example.backend.dto;

import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementType;

/** Lien de confirmation à générer pour un canal et une finalité (prospection par défaut). */
public record ConsentLinkRequest(ConsentementChannel channel, ConsentementType consentType) {}
