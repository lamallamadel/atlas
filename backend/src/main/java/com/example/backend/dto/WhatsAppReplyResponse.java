package com.example.backend.dto;

/** Réponse mise en file d'envoi ; le statut de livraison suit dans « Messages sortants ». */
public record WhatsAppReplyResponse(Long outboundMessageId, Long messageId, String status) {}
