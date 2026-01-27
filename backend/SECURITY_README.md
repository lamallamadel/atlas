# Backend Security Implementation

This backend application implements comprehensive security hardening following OWASP best practices.

## Quick Start

### 1. Set Encryption Password

```bash
# Generate a secure password
openssl rand -base64 32

# Set as environment variable
export JASYPT_ENCRYPTOR_PASSWORD="your-generated-password"
```

### 2. Encrypt Secrets

```bash
# Linux/Mac
./encrypt-secret.sh "myDatabasePassword"

# Windows
.\encrypt-secret.ps1 "myDatabasePassword"
```

### 3. Configure Application

Update `application.yml` or set environment variables:

```yaml
spring:
  datasource:
    password: ENC(your-encrypted-password)
```

### 4. Run Application

```bash
mvn spring-boot:run
```

## Security Features

### ✅ Implemented

- **Content Security Policy (CSP)** with nonce-based script whitelisting
- **CSRF Protection** with cookie-based token repository
- **HMAC-SHA256 Webhook Signature Verification**
- **Database Field Encryption** using Jasypt AES-256
- **JWT Signing Key Rotation** with zero-downtime rollover
- **API Secret Rotation** with overlap period
- **Security Headers** (HSTS, X-Frame-Options, CSP, etc.)
- **Dependency Vulnerability Scanning** via GitHub Actions
- **Automated Dependency Updates** via Dependabot

### Configuration Files

- **Main Config**: `src/main/java/com/example/backend/config/SecurityConfig.java`
- **Jasypt Config**: `src/main/java/com/example/backend/config/JasyptConfig.java`
- **Application Properties**: `src/main/resources/application.yml`
- **Test Profiles**: `src/main/resources/application-e2e.yml`

### Services

- **JwtSigningKeyRotationService**: Manages JWT signing key lifecycle
- **SecretsRotationService**: Handles API secret rotation
- **FieldEncryptionService**: Encrypts/decrypts database fields
- **WhatsAppWebhookSignatureValidator**: Validates webhook signatures

### Filters

- **CsrfCookieFilter**: Manages CSRF token cookies
- **CspNonceFilter**: Generates CSP nonces
- **WebhookSignatureFilter**: Validates webhook signatures

## Testing

### Unit Tests

```bash
mvn test
```

### E2E Tests (H2)

```bash
mvn verify -Pbackend-e2e-h2
```

### E2E Tests (PostgreSQL)

```bash
mvn verify -Pbackend-e2e-postgres
```

### Security Scanning

```bash
# Snyk
snyk test --severity-threshold=high

# Trivy
trivy fs --severity HIGH,CRITICAL .
```

## Environment Variables

### Production Required

```bash
JASYPT_ENCRYPTOR_PASSWORD=<secure-key>
SECURITY_CSRF_ENABLED=true
WEBHOOK_SIGNATURE_ENABLED=true
JWT_ROTATION_ENABLED=true
SECRET_ROTATION_ENABLED=true
OAUTH2_ISSUER_URI=https://your-idp.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
```

### Optional Configuration

```bash
# JWT Rotation
JWT_ROTATION_CRON=0 0 3 1 * ?
JWT_GRACE_PERIOD_DAYS=7

# Secret Rotation
SECRET_ROTATION_CRON=0 0 2 * * ?
SECRET_OVERLAP_PERIOD_HOURS=24
```

## API Endpoints

### CSRF Token

```bash
GET /api/v1/csrf
```

Returns CSRF token in `XSRF-TOKEN` cookie.

### Health Check

```bash
GET /actuator/health
```

Public endpoint, no authentication required.

### Metrics (Protected)

```bash
GET /actuator/metrics
GET /actuator/prometheus
```

Requires authentication.

## Troubleshooting

### Common Issues

1. **"Decryption failed"**: Check `JASYPT_ENCRYPTOR_PASSWORD` is set correctly
2. **403 CSRF errors**: Ensure `X-XSRF-TOKEN` header is sent
3. **401 Webhook errors**: Verify webhook signature format and secret

### Debug Mode

```bash
# Enable debug logging
export LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
mvn spring-boot:run
```

### Verify Security Headers

```bash
curl -I http://localhost:8080/api/health
```

Check for:
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`

## Documentation

- [Full Security Implementation Guide](../SECURITY_IMPLEMENTATION.md)
- [Quick Reference Guide](../SECURITY_QUICK_REFERENCE.md)
- [Environment Variables Example](.env.security.example)

## Support

For security issues, contact: security@example.com

**DO NOT** open public GitHub issues for security vulnerabilities.
