package com.example.backend.owner;

/** Envoie un code à usage unique. Renvoie le canal utilisé ({@code WHATSAPP}, {@code SMS}, …). */
public interface OtpSender {

    String send(String phone, String code);
}
