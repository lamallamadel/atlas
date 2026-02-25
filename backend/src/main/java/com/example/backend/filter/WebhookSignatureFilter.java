package com.example.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

@Component
@Order(3)
public class WebhookSignatureFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(WebhookSignatureFilter.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    @Value("${app.webhook.signature.enabled:true}")
    private boolean signatureValidationEnabled;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!signatureValidationEnabled
                || !request.getRequestURI().startsWith("/api/v1/webhooks/")) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        filterChain.doFilter(wrappedRequest, response);
    }

    public static String computeHmacSha256(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Error computing HMAC-SHA256 signature", e);
            throw new RuntimeException("Failed to compute signature", e);
        }
    }

    public static boolean validateSignature(
            String payload, String receivedSignature, String secret) {
        if (payload == null || receivedSignature == null || secret == null) {
            return false;
        }

        String expectedSignature = computeHmacSha256(payload, secret);
        return constantTimeEquals(expectedSignature, receivedSignature);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }

        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }

        return result == 0;
    }
}
