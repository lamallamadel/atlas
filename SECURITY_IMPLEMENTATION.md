# Security Hardening Implementation

This document describes the comprehensive security hardening implemented in the application.

## Table of Contents

1. [Content Security Policy (CSP)](#content-security-policy)
2. [CSRF Protection](#csrf-protection)
3. [Webhook Signature Verification](#webhook-signature-verification)
4. [Dependency Vulnerability Scanning](#dependency-vulnerability-scanning)
5. [Secrets Rotation Strategy](#secrets-rotation-strategy)
6. [Security Headers](#security-headers)
7. [Database Encryption](#database-encryption)

## Content Security Policy (CSP)

### Implementation

CSP headers are configured in `SecurityConfig.java` with nonce-based script whitelisting:

```java
.contentSecurityPolicy(csp -> csp
    .policyDirectives("default-src 'self'; " +
        "script-src 'self' 'nonce-{nonce}'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'")
)
```

### Features

- **Nonce-based script whitelisting**: Dynamic nonces generated per request via `CspNonceFilter`
- **Strict directives**: Only allows resources from same origin
- **Frame protection**: Prevents clickjacking with `frame-ancestors 'none'`
- **Form action restriction**: Prevents form submissions to external domains

### Usage

The CSP nonce is automatically generated and injected into responses. To use in inline scripts:

```html
<script nonce="${cspNonce}">
  // Your inline script here
</script>
```

## CSRF Protection

### Implementation

CSRF protection uses Spring Security's `CookieCsrfTokenRepository` with the following configuration:

- **Cookie name**: `XSRF-TOKEN`
- **Header name**: `X-XSRF-TOKEN`
- **HttpOnly**: `false` (to allow JavaScript access)

### Configuration

```yaml
app:
  security:
    csrf:
      enabled: true  # Can be disabled for testing
```

### Excluded Endpoints

The following endpoints are excluded from CSRF protection:

- `/api/v1/webhooks/**` - External webhooks (protected by signature validation)
- `/actuator/**` - Health checks
- `/swagger-ui/**` - API documentation
- `/api-docs/**` - OpenAPI specs

### Frontend Integration

Angular applications must include the CSRF token in all state-changing requests:

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Token is automatically read from XSRF-TOKEN cookie
// and sent as X-XSRF-TOKEN header by Angular's HttpClient
```

## Webhook Signature Verification

### Implementation

Webhook endpoints validate HMAC-SHA256 signatures to ensure authenticity.

**Service**: `WhatsAppWebhookSignatureValidator.java`

### How it works

1. Webhook provider signs the payload with a shared secret using HMAC-SHA256
2. Signature is sent in `X-Hub-Signature-256` header
3. Server recomputes the signature and compares using constant-time comparison
4. Request is rejected if signatures don't match

### Example Usage

```java
@PostMapping("/inbound")
public ResponseEntity<String> receiveWebhook(
    @RequestHeader("X-Hub-Signature-256") String signature,
    @RequestBody String rawPayload) {
    
    if (!signatureValidator.validateSignature(rawPayload, signature, orgId)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
    }
    // Process webhook...
}
```

### Configuration

```yaml
app:
  webhook:
    signature:
      enabled: true
```

### Signature Format

```
sha256=<hex_encoded_hmac_sha256_hash>
```

## Dependency Vulnerability Scanning

### GitHub Actions Workflows

**File**: `.github/workflows/security-scan.yml`

### Tools Integrated

1. **Snyk**: Scans Maven and npm dependencies
2. **Dependabot**: Automated dependency updates
3. **CodeQL**: Static analysis for Java and JavaScript
4. **Trivy**: Filesystem vulnerability scanning

### Configuration

**Dependabot** (`.github/dependabot.yml`):
- Weekly scans on Mondays
- Auto-creates PRs for high/critical vulnerabilities
- Groups related dependencies

**Security Scan Workflow**:
- Runs on push, PR, and daily schedule
- Fails build on HIGH/CRITICAL CVEs
- Uploads SARIF reports to GitHub Security

### Manual Scanning

```bash
# Snyk scan (requires SNYK_TOKEN)
cd backend && snyk test --severity-threshold=high

cd frontend && snyk test --severity-threshold=high

# Trivy scan
trivy fs --severity HIGH,CRITICAL .
```

## Secrets Rotation Strategy

### JWT Signing Key Rotation

**Service**: `JwtSigningKeyRotationService.java`

**Features**:
- Automatic rotation every 90 days
- 7-day grace period for old keys
- Zero-downtime rollover
- Multiple concurrent key support

**Configuration**:
```yaml
app:
  security:
    jwt:
      rotation:
        enabled: true
        cron: "0 0 3 1 * ?"  # 1st of every month at 3 AM
        grace-period-days: 7
```

**Manual Rotation**:
```java
@Autowired
private JwtSigningKeyRotationService jwtRotationService;

// Force immediate rotation
jwtRotationService.rotateSigningKeys();
```

### API Secret Rotation

**Service**: `SecretsRotationService.java`

**Features**:
- Configurable rotation schedule
- Overlap period for gradual migration
- Support for webhook secrets, API keys, etc.

**Configuration**:
```yaml
app:
  security:
    secret:
      rotation:
        enabled: true
        cron: "0 0 2 * * ?"  # Daily at 2 AM
        overlap-period-hours: 24
```

**Usage**:
```java
@Autowired
private SecretsRotationService secretsRotationService;

// Register a secret
secretsRotationService.registerSecret("webhook-secret", initialValue);

// Get current secret
String currentSecret = secretsRotationService.getCurrentSecret("webhook-secret");

// Validate (accepts current and previous secret during overlap)
boolean valid = secretsRotationService.validateSecret("webhook-secret", receivedSecret);

// Force rotation
secretsRotationService.forceRotation("webhook-secret");
```

## Security Headers

### Implemented Headers

All security headers are configured in `SecurityConfig.java`:

#### 1. Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

- Forces HTTPS for 1 year
- Applies to all subdomains
- Prevents downgrade attacks

#### 2. X-Frame-Options

```
X-Frame-Options: DENY
```

- Prevents clickjacking attacks
- Disallows embedding in iframes

#### 3. X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

- Prevents MIME type sniffing
- Forces browsers to respect declared content types

#### 4. X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

- Enables browser XSS filtering
- Blocks page rendering if attack detected

#### 5. Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

- Controls referrer information sent with requests
- Balance between privacy and functionality

#### 6. Permissions-Policy

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

- Disables sensitive browser features
- Reduces attack surface

### Verification

Check headers with curl:

```bash
curl -I https://your-api.example.com/api/health
```

## Database Encryption at Rest

### Implementation

Uses Jasypt (Java Simplified Encryption) for transparent field-level encryption.

**Configuration**: `JasyptConfig.java`

### Algorithm

- **Algorithm**: PBEWITHHMACSHA512ANDAES_256
- **Key derivation**: PBKDF2 with 1000 iterations
- **Salt**: Random per encryption
- **IV**: Random per encryption
- **Output**: Base64 encoded

### Entity Encryption

**Converter**: `EncryptedStringConverter.java`

### Usage in Entities

```java
@Entity
public class SensitiveDataEntity {
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "api_key_encrypted", columnDefinition = "text")
    private String apiKey;
    
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "secret_encrypted", columnDefinition = "text")
    private String secret;
}
```

### Encrypted Fields

The following fields are encrypted at rest:

#### WhatsAppProviderConfig
- `apiKeyEncrypted`
- `apiSecretEncrypted`
- `webhookSecretEncrypted`

#### EmailProviderConfig
- `smtpPasswordEncrypted`
- `apiKeyEncrypted`
- `webhookSecretEncrypted`

#### SmsProviderConfig
- `twilioAuthTokenEncrypted`
- `awsAccessKeyEncrypted`
- `awsSecretKeyEncrypted`
- `webhookSecretEncrypted`

### Encryption Key Management

**Environment Variable**:
```bash
export JASYPT_ENCRYPTOR_PASSWORD="your-secure-encryption-password"
```

**Generate secure key**:
```bash
openssl rand -base64 32
```

**CRITICAL**: Store the encryption password securely:
- Use AWS Secrets Manager / Azure Key Vault in production
- Never commit to version control
- Rotate periodically
- Keep backups in secure offline storage

### Encrypting Configuration Values

**CLI Tool**:
```bash
java -cp jasypt-1.9.3.jar org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI \
  input="mySecretValue" \
  password="${JASYPT_ENCRYPTOR_PASSWORD}" \
  algorithm=PBEWITHHMACSHA512ANDAES_256
```

**In application.yml**:
```yaml
datasource:
  password: ENC(QXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5...)
```

### Field Encryption Service

For programmatic encryption/decryption:

```java
@Autowired
private FieldEncryptionService encryptionService;

// Encrypt
String encrypted = encryptionService.encrypt("plaintext");

// Decrypt
String decrypted = encryptionService.decrypt(encrypted);
```

## Production Deployment Checklist

### Environment Variables

Ensure these are set in production:

```bash
# Required
JASYPT_ENCRYPTOR_PASSWORD=<secure-key>
SECURITY_CSRF_ENABLED=true
WEBHOOK_SIGNATURE_ENABLED=true
JWT_ROTATION_ENABLED=true
SECRET_ROTATION_ENABLED=true

# OAuth2/JWT
OAUTH2_ISSUER_URI=https://your-idp.production.com
JWT_GRACE_PERIOD_DAYS=7

# CORS (restrict to your domains)
CORS_ALLOWED_ORIGINS=https://app.example.com,https://api.example.com

# Database (encrypted)
SPRING_DATASOURCE_PASSWORD=ENC(...)
```

### GitHub Secrets

Configure in GitHub repository settings:

```
SNYK_TOKEN: <your-snyk-api-token>
```

### Monitoring

1. **Security Scan Results**: Check GitHub Security tab
2. **Dependabot Alerts**: Review and merge PRs promptly
3. **Key Rotation Logs**: Monitor application logs for rotation events
4. **Failed Authentication Attempts**: Set up alerts for unusual patterns

### Testing

```bash
# Test CSRF protection
curl -X POST https://api.example.com/api/v1/dossiers \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  # Should fail without CSRF token

# Test webhook signature
curl -X POST https://api.example.com/api/v1/webhooks/whatsapp/inbound \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{"test": "data"}'
  # Should return 401 Unauthorized

# Test security headers
curl -I https://api.example.com/api/health
# Verify all security headers are present
```

## Troubleshooting

### CSRF Token Not Found

**Symptom**: 403 Forbidden on POST/PUT/DELETE requests

**Solution**: 
1. Ensure CSRF cookie is being set
2. Check frontend is sending X-XSRF-TOKEN header
3. Verify endpoint isn't in excluded list

### Webhook Signature Validation Failing

**Symptom**: Webhooks returning 401 Unauthorized

**Solution**:
1. Verify webhook secret matches provider configuration
2. Check signature format: `sha256=<hex>`
3. Ensure raw body is used (not parsed JSON)
4. Validate constant-time comparison

### Decryption Errors

**Symptom**: "Decryption failed" exceptions

**Solution**:
1. Verify JASYPT_ENCRYPTOR_PASSWORD matches encryption key
2. Check algorithm matches (PBEWITHHMACSHA512ANDAES_256)
3. Ensure encrypted values start with `ENC(` and end with `)`
4. Re-encrypt data if key changed

### Security Scan Failures

**Symptom**: GitHub Actions workflow failing

**Solution**:
1. Review SARIF reports in Security tab
2. Update vulnerable dependencies
3. Add suppressions for false positives (with justification)
4. Contact security team for critical vulnerabilities

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [Jasypt Documentation](http://www.jasypt.org/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [GitHub Security Features](https://docs.github.com/en/code-security)
