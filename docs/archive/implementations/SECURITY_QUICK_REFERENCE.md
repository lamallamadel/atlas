# Security Quick Reference Guide

Quick reference for common security operations.

## Encrypting Secrets

### Using the Encryption Script

**Linux/Mac:**
```bash
export JASYPT_ENCRYPTOR_PASSWORD="your-master-password"
cd backend
./encrypt-secret.sh "mySecretValue"
```

**Windows:**
```powershell
$env:JASYPT_ENCRYPTOR_PASSWORD = "your-master-password"
cd backend
.\encrypt-secret.ps1 "mySecretValue"
```

### Using Maven Plugin

```bash
cd backend
mvn jasypt:encrypt-value -Djasypt.encryptor.password="$JASYPT_ENCRYPTOR_PASSWORD" -Djasypt.plugin.value="mySecretValue"
```

## Environment Variables Checklist

### Required in Production

```bash
# Encryption
JASYPT_ENCRYPTOR_PASSWORD=<generate-with-openssl-rand>

# Security Features
SECURITY_CSRF_ENABLED=true
WEBHOOK_SIGNATURE_ENABLED=true
JWT_ROTATION_ENABLED=true
SECRET_ROTATION_ENABLED=true

# OAuth/JWT
OAUTH2_ISSUER_URI=https://your-idp.example.com
JWT_GRACE_PERIOD_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=https://app.example.com
```

## Common Tasks

### Generate Encryption Key

```bash
openssl rand -base64 32
```

### Encrypt Database Password

```bash
./encrypt-secret.sh "myDatabasePassword"
# Result: ENC(ABC123...)
```

Then in `application.yml`:
```yaml
spring:
  datasource:
    password: ENC(ABC123...)
```

### Force Secret Rotation

```bash
curl -X POST http://localhost:8080/actuator/secrets/rotate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "webhook-secret"}'
```

### Verify Security Headers

```bash
curl -I https://api.example.com/api/health | grep -E "(Strict-Transport-Security|X-Frame-Options|Content-Security-Policy)"
```

### Test CSRF Protection

```bash
# Should fail without CSRF token
curl -X POST https://api.example.com/api/v1/dossiers \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# Get CSRF token first
curl -c cookies.txt https://api.example.com/api/v1/csrf

# Then use it
curl -b cookies.txt -X POST https://api.example.com/api/v1/dossiers \
  -H "Authorization: Bearer token" \
  -H "X-XSRF-TOKEN: <token-from-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

### Test Webhook Signature

```bash
SECRET="your-webhook-secret"
PAYLOAD='{"test":"data"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print "sha256="$2}')

curl -X POST http://localhost:8080/api/v1/webhooks/whatsapp/inbound \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

## Dependency Scanning

### Run Snyk Scan

```bash
# Backend
cd backend
snyk test --severity-threshold=high

# Frontend
cd frontend
snyk test --severity-threshold=high
```

### Run Trivy Scan

```bash
trivy fs --severity HIGH,CRITICAL .
```

### Check Dependabot Alerts

```bash
# View in GitHub UI
https://github.com/YOUR_ORG/YOUR_REPO/security/dependabot
```

## Secrets Rotation

### Check Rotation Schedule

```yaml
# JWT keys: 1st of every month at 3 AM
JWT_ROTATION_CRON: "0 0 3 1 * ?"

# API secrets: Daily at 2 AM
SECRET_ROTATION_CRON: "0 0 2 * * ?"
```

### View Current Keys

```bash
# Check application logs
grep "Rotated JWT signing key" logs/application.log
grep "Rotated secret" logs/application.log
```

### Manual Rotation (via Admin API)

```java
// In code
@Autowired
private JwtSigningKeyRotationService jwtService;

@Autowired
private SecretsRotationService secretsService;

// Force rotation
jwtService.rotateSigningKeys();
secretsService.forceRotation("api-key");
```

## Troubleshooting

### "Decryption failed" Error

1. Verify `JASYPT_ENCRYPTOR_PASSWORD` is set correctly
2. Check encrypted value format: `ENC(...)`
3. Re-encrypt the value if key changed

### CSRF 403 Forbidden

1. Check if CSRF is enabled: `SECURITY_CSRF_ENABLED=true`
2. Verify frontend sends `X-XSRF-TOKEN` header
3. Ensure cookie `XSRF-TOKEN` exists
4. Check endpoint not in exclusion list

### Webhook 401 Unauthorized

1. Verify signature format: `sha256=<hex>`
2. Check webhook secret is configured
3. Ensure raw body is used (not parsed)
4. Test signature generation:
   ```bash
   echo -n "payload" | openssl dgst -sha256 -hmac "secret"
   ```

### Security Scan Failing

1. Check SARIF reports in GitHub Security tab
2. Update vulnerable dependencies
3. Review false positives
4. Add suppressions with justification

## Best Practices

### ✅ Do's

- Rotate encryption keys regularly
- Use environment variables for secrets
- Enable all security features in production
- Monitor security scan results
- Keep dependencies updated
- Use HTTPS in production
- Restrict CORS to known origins
- Set strong CSP policies
- Validate webhook signatures
- Log security events

### ❌ Don'ts

- Never commit secrets to git
- Don't disable CSRF in production
- Don't use default encryption passwords
- Don't ignore security alerts
- Don't expose actuator endpoints publicly
- Don't use `CORS_ALLOWED_ORIGINS=*` in production
- Don't skip dependency updates
- Don't bypass webhook signature validation
- Don't store plaintext secrets in database
- Don't reuse encryption keys across environments

## Emergency Procedures

### Suspected Key Compromise

1. **Immediate Actions:**
   ```bash
   # Force rotate all secrets
   curl -X POST https://api.example.com/admin/rotate-all-secrets \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

2. **Generate new encryption key:**
   ```bash
   NEW_KEY=$(openssl rand -base64 32)
   echo "New encryption key: $NEW_KEY"
   ```

3. **Re-encrypt all secrets with new key**

4. **Update environment variables**

5. **Monitor logs for unauthorized access**

### CVE Response

1. **Check severity in GitHub Security tab**

2. **For CRITICAL vulnerabilities:**
   ```bash
   # Update dependency immediately
   mvn versions:use-latest-versions
   npm update
   ```

3. **Run tests:**
   ```bash
   mvn test
   npm test
   ```

4. **Deploy hotfix**

5. **Document in incident log**

## Monitoring Queries

### Check Failed Auth Attempts

```sql
SELECT COUNT(*), DATE(created_at)
FROM audit_event
WHERE event_type = 'AUTHENTICATION_FAILURE'
GROUP BY DATE(created_at)
HAVING COUNT(*) > 100;
```

### Check Key Rotation Status

```bash
# Recent rotations
grep "Rotated" logs/application.log | tail -20

# Next scheduled rotation
grep "rotation.cron" application.yml
```

### Security Metrics

```bash
# Prometheus metrics
curl http://localhost:8080/actuator/prometheus | grep security

# Failed webhook signatures
curl http://localhost:8080/actuator/prometheus | grep webhook_signature_failure
```

## Resources

- [Full Implementation Guide](./SECURITY_IMPLEMENTATION.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Docs](https://docs.spring.io/spring-security/reference/)
- [Jasypt Documentation](http://www.jasypt.org/)
