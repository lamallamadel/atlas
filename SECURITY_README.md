# Security Documentation

This project implements comprehensive security hardening. Choose the appropriate documentation based on your needs:

## 📚 Documentation Index

### For Developers

- **[Security Implementation Summary](./SECURITY_IMPLEMENTATION_SUMMARY.md)** - Overview of all security features
- **[Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)** - Common tasks and commands
- **[Backend Security README](./backend/SECURITY_README.md)** - Backend-specific security setup

### For Security Teams

- **[Full Security Implementation Guide](./SECURITY_IMPLEMENTATION.md)** - Detailed technical implementation
- **[GitHub Workflows](./.github/workflows/security-scan.yml)** - Automated security scanning
- **[Dependabot Config](./.github/dependabot.yml)** - Dependency update automation

### For Operations/DevOps

- **[Environment Variables Example](./backend/.env.security.example)** - Required configuration
- **[Encryption Scripts](./backend/)** - `encrypt-secret.sh` and `encrypt-secret.ps1`

## 🔒 Security Features Implemented

✅ **Content Security Policy (CSP)** with nonce-based script whitelisting  
✅ **CSRF Protection** for all state-changing operations  
✅ **HMAC-SHA256 Webhook Signature Verification**  
✅ **Automated Dependency Vulnerability Scanning** (Snyk, Dependabot, CodeQL, Trivy)  
✅ **Secrets Rotation Strategy** for API keys and JWT signing keys  
✅ **Security Headers** (HSTS, X-Frame-Options, CSP, etc.)  
✅ **Database Encryption at Rest** using Jasypt AES-256  

## 🚀 Quick Start

### 1. Generate Encryption Key
```bash
openssl rand -base64 32
```

### 2. Set Environment Variable
```bash
export JASYPT_ENCRYPTOR_PASSWORD="your-generated-key"
```

### 3. Encrypt Secrets
```bash
cd backend
./encrypt-secret.sh "mySecret"
```

### 4. Configure Application
```yaml
# application.yml
spring:
  datasource:
    password: ENC(encrypted_value_here)
```

## 📋 Production Checklist

Before deploying to production:

- [ ] Generate strong `JASYPT_ENCRYPTOR_PASSWORD`
- [ ] Encrypt all sensitive values
- [ ] Set security environment variables
- [ ] Configure CORS for production domains
- [ ] Set up `SNYK_TOKEN` in GitHub
- [ ] Enable all security features
- [ ] Test security headers
- [ ] Test CSRF protection
- [ ] Test webhook signatures

## 🛡️ Security Contacts

For security vulnerabilities: **security@example.com**

**DO NOT** open public GitHub issues for security vulnerabilities.

## 📖 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [Jasypt Documentation](http://www.jasypt.org/)
- [GitHub Security Features](https://docs.github.com/en/code-security)
