package com.example.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(2)
public class CspNonceFilter extends OncePerRequestFilter {

    private static final String CSP_NONCE_ATTRIBUTE = "cspNonce";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String nonce = generateNonce();
        request.setAttribute(CSP_NONCE_ATTRIBUTE, nonce);

        String cspHeader = response.getHeader("Content-Security-Policy");
        if (cspHeader != null && cspHeader.contains("{nonce}")) {
            cspHeader = cspHeader.replace("{nonce}", nonce);
            response.setHeader("Content-Security-Policy", cspHeader);
        }

        filterChain.doFilter(request, response);
    }

    private String generateNonce() {
        byte[] nonceBytes = new byte[32];
        SECURE_RANDOM.nextBytes(nonceBytes);
        return Base64.getEncoder().encodeToString(nonceBytes);
    }

    public static String getNonce(HttpServletRequest request) {
        Object nonce = request.getAttribute(CSP_NONCE_ATTRIBUTE);
        return nonce != null ? nonce.toString() : "";
    }
}
