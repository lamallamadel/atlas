package com.example.backend.service;

import com.example.backend.entity.ClientAuthToken;
import com.example.backend.entity.Dossier;
import com.example.backend.repository.ClientAuthTokenRepository;
import com.example.backend.repository.DossierRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MagicLinkAuthService {

    @Autowired private ClientAuthTokenRepository tokenRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private OutboundMessageService outboundMessageService;

    @Value(
            "${customer-portal.jwt.secret:customer-portal-secret-key-change-in-production-minimum-256-bits}")
    private String jwtSecret;

    @Value("${customer-portal.magic-link.expiration-hours:24}")
    private int expirationHours;

    @Value("${customer-portal.base-url:http://localhost:4200}")
    private String portalBaseUrl;

    @Transactional
    public String generateMagicLink(Long dossierId, String channel) {
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(() -> new RuntimeException("Dossier not found"));

        String token = generateSecureToken(dossier);

        ClientAuthToken authToken = new ClientAuthToken();
        authToken.setToken(token);
        authToken.setOrgId(dossier.getOrgId());
        authToken.setDossierId(dossierId);
        authToken.setClientEmail(dossier.getLeadEmail());
        authToken.setClientPhone(dossier.getLeadPhone());
        authToken.setExpiresAt(LocalDateTime.now().plusHours(expirationHours));

        tokenRepository.save(authToken);

        String magicLink = portalBaseUrl + "/auth?token=" + token;

        sendMagicLink(dossier, magicLink, channel);

        return magicLink;
    }

    private String generateSecureToken(Dossier dossier) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        Date expiration = new Date(nowMillis + (expirationHours * 60 * 60 * 1000));

        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(dossier.getId().toString())
                .claim("orgId", dossier.getOrgId())
                .claim("dossierId", dossier.getId())
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    private void sendMagicLink(Dossier dossier, String magicLink, String channel) {
        String message =
                String.format(
                        "Bonjour %s,\n\nVoici votre lien d'accès sécurisé au portail client :\n\n%s\n\nCe lien est valide pendant %d heures.",
                        dossier.getLeadName() != null ? dossier.getLeadName() : "Client",
                        magicLink,
                        expirationHours);

        java.util.Map<String, Object> payloadJson = new java.util.HashMap<>();
        payloadJson.put("clientName", dossier.getLeadName());
        payloadJson.put("magicLink", magicLink);
        payloadJson.put("expirationHours", expirationHours);

        if ("EMAIL".equalsIgnoreCase(channel) && dossier.getLeadEmail() != null) {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    com.example.backend.entity.enums.MessageChannel.EMAIL,
                    dossier.getLeadEmail(),
                    "MAGIC_LINK",
                    "Accès à votre portail client",
                    payloadJson,
                    "magic-link-" + dossier.getId() + "-" + System.currentTimeMillis());
        } else if ("WHATSAPP".equalsIgnoreCase(channel) && dossier.getLeadPhone() != null) {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    com.example.backend.entity.enums.MessageChannel.WHATSAPP,
                    dossier.getLeadPhone(),
                    "MAGIC_LINK",
                    null,
                    payloadJson,
                    "magic-link-" + dossier.getId() + "-" + System.currentTimeMillis());
        } else if ("SMS".equalsIgnoreCase(channel) && dossier.getLeadPhone() != null) {
            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    com.example.backend.entity.enums.MessageChannel.SMS,
                    dossier.getLeadPhone(),
                    "MAGIC_LINK",
                    null,
                    payloadJson,
                    "magic-link-" + dossier.getId() + "-" + System.currentTimeMillis());
        }
    }

    @Transactional(readOnly = true)
    public ClientAuthToken validateToken(String token) {
        LocalDateTime now = LocalDateTime.now();
        return tokenRepository
                .findByTokenAndExpiresAtAfter(token, now)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
    }

    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
