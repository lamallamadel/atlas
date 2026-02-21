# PWA Deployment Checklist

Complete this checklist before deploying the PWA to production.

## Pre-Deployment

### 1. Assets Preparation ⚠️

- [ ] **Generate PWA Icons**
  ```bash
  npm install --save-dev sharp
  node scripts/generate-pwa-icons.js path/to/logo-1024x1024.png
  ```
  - [ ] All 8 standard icons (72x72 to 512x512)
  - [ ] 2 maskable icons (192x192, 512x512)
  - [ ] 4 shortcut icons (96x96 each)
  - [ ] Favicon (32x32)

- [ ] **Create Screenshots**
  - [ ] Desktop wide: 1920x1080 (2 screenshots recommended)
  - [ ] Mobile narrow: 750x1334 (3 screenshots recommended)
  - [ ] Place in `src/assets/screenshots/`

### 2. Configuration

- [ ] **VAPID Keys (Push Notifications)**
  ```bash
  npx web-push generate-vapid-keys
  ```
  - [ ] Add public key to `environment.ts`
  - [ ] Add public key to `environment.prod.ts`
  - [ ] Store private key securely (backend config)

- [ ] **Manifest Configuration**
  - [ ] Review `src/manifest.json`
  - [ ] Update app name and description
  - [ ] Verify theme colors
  - [ ] Check icon paths
  - [ ] Verify screenshot paths
  - [ ] Update shortcuts URLs if needed

- [ ] **Service Worker Configuration**
  - [ ] Review `ngsw-config.json`
  - [ ] Adjust cache sizes if needed
  - [ ] Adjust cache expiration times
  - [ ] Add/remove API endpoints as needed

- [ ] **Environment Variables**
  - [ ] VAPID public key set
  - [ ] API base URL correct
  - [ ] OIDC configuration correct

### 3. Backend Integration

- [ ] **Push Notifications Endpoints**
  ```
  POST /api/v1/push/subscribe
  POST /api/v1/push/unsubscribe
  POST /api/v1/push/send
  ```
  - [ ] Endpoints implemented
  - [ ] VAPID private key configured
  - [ ] Database for subscriptions
  - [ ] Push sending service

- [ ] **WebAuthn Endpoints** (Biometric Auth)
  ```
  POST /api/v1/auth/webauthn/register/challenge
  POST /api/v1/auth/webauthn/register/verify
  GET  /api/v1/auth/webauthn/authenticate/challenge
  POST /api/v1/auth/webauthn/authenticate/verify
  DELETE /api/v1/auth/webauthn/credentials/{id}
  ```
  - [ ] Endpoints implemented
  - [ ] Credential storage
  - [ ] Challenge generation
  - [ ] Signature verification

### 4. Security

- [ ] **HTTPS**
  - [ ] SSL certificate installed
  - [ ] Force HTTPS redirect
  - [ ] HTTPS enabled for all environments

- [ ] **Content Security Policy (CSP)**
  ```nginx
  Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'sha256-xxx';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.example.com;
  ```
  - [ ] CSP headers configured
  - [ ] Service worker allowed
  - [ ] API endpoints allowed

- [ ] **Permissions**
  - [ ] Notifications permission request
  - [ ] Camera permission (if using QR scanner)
  - [ ] Location permission (if using)
  - [ ] Storage permission

### 5. Testing

- [ ] **Local Testing**
  ```bash
  npm run build:prod
  npx http-server dist/frontend -p 8080 --ssl
  ```
  - [ ] PWA installable
  - [ ] Service worker registers
  - [ ] Offline mode works
  - [ ] Push notifications work
  - [ ] Biometric auth works (if supported)

- [ ] **Lighthouse Audit**
  ```bash
  npm run lighthouse:ci
  ```
  - [ ] PWA: 100
  - [ ] Performance: 90+
  - [ ] Accessibility: 90+
  - [ ] Best Practices: 90+
  - [ ] SEO: 90+

- [ ] **Cross-Browser Testing**
  - [ ] Chrome (Desktop & Mobile)
  - [ ] Firefox (Desktop & Mobile)
  - [ ] Safari (Desktop & Mobile)
  - [ ] Edge (Desktop & Mobile)

- [ ] **Device Testing**
  - [ ] Android phone (Chrome)
  - [ ] iPhone (Safari)
  - [ ] iPad (Safari)
  - [ ] Desktop (all browsers)

- [ ] **Feature Testing**
  - [ ] Install PWA
  - [ ] Uninstall PWA
  - [ ] Add to home screen (iOS)
  - [ ] App shortcuts work
  - [ ] Offline mode works
  - [ ] Service worker updates
  - [ ] Push notifications
  - [ ] Biometric authentication
  - [ ] Bottom navigation (mobile)
  - [ ] Swipe gestures
  - [ ] Safe area support (notched devices)
  - [ ] Touch targets (48x48px minimum)

## Deployment

### 1. Build

```bash
cd frontend
npm run build:prod
```

- [ ] Build successful
- [ ] No errors in console
- [ ] Service worker generated
- [ ] Manifest included
- [ ] Icons included
- [ ] Bundle size acceptable

### 2. Server Configuration

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Root directory
    root /var/www/app/dist/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker (no cache)
    location ~* (service-worker|ngsw-worker)\.js$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Manifest (short cache)
    location = /manifest.json {
        add_header Cache-Control "public, max-age=3600";
        expires 1h;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

- [ ] Configuration applied
- [ ] SSL configured
- [ ] Compression enabled
- [ ] Caching configured
- [ ] Security headers set
- [ ] API proxy configured
- [ ] SPA routing works

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName app.example.com
    DocumentRoot /var/www/app/dist/frontend

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
    </IfModule>

    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # No cache for service worker
    <FilesMatch "(service-worker|ngsw-worker)\.js$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>

    # SPA routing
    <Directory /var/www/app/dist/frontend>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

- [ ] Configuration applied
- [ ] SSL configured
- [ ] Compression enabled
- [ ] Caching configured
- [ ] SPA routing works

### 3. DNS & CDN

- [ ] DNS A/CNAME records set
- [ ] CDN configured (if using)
- [ ] CDN cache rules configured
- [ ] SSL certificate at CDN level

### 4. Monitoring

- [ ] **Error Tracking**
  - [ ] Sentry/Rollbar configured
  - [ ] Source maps uploaded
  - [ ] Error alerts set up

- [ ] **Analytics**
  - [ ] Google Analytics (or alternative)
  - [ ] PWA install tracking
  - [ ] Offline usage tracking
  - [ ] Feature usage tracking

- [ ] **Performance Monitoring**
  - [ ] Real User Monitoring (RUM)
  - [ ] Web Vitals tracking
  - [ ] Service worker metrics
  - [ ] API response times

## Post-Deployment

### 1. Verification

- [ ] **PWA Installable**
  - [ ] Install prompt appears (Chrome)
  - [ ] Add to Home Screen works (Safari)
  - [ ] App appears on device
  - [ ] App opens in standalone mode

- [ ] **Service Worker**
  - [ ] Service worker active
  - [ ] Caching working
  - [ ] Offline mode functional
  - [ ] Background sync works

- [ ] **Push Notifications**
  - [ ] Permission prompt works
  - [ ] Subscription successful
  - [ ] Test notification received
  - [ ] Notification actions work

- [ ] **Biometric Auth**
  - [ ] Registration works
  - [ ] Authentication works
  - [ ] Fallback to password works

### 2. User Communication

- [ ] **In-App Announcements**
  - [ ] PWA install prompt banner
  - [ ] Push notification opt-in dialog
  - [ ] Biometric auth setup prompt
  - [ ] Offline mode explanation

- [ ] **Documentation**
  - [ ] User guide for PWA install
  - [ ] Help article for push notifications
  - [ ] FAQ for common issues
  - [ ] Video tutorials (optional)

- [ ] **Email/Newsletter**
  - [ ] Announce PWA availability
  - [ ] Highlight offline features
  - [ ] Promote mobile app experience

### 3. Monitoring & Iteration

- [ ] **Week 1**
  - [ ] Monitor error rates
  - [ ] Check install metrics
  - [ ] Review user feedback
  - [ ] Fix critical issues

- [ ] **Week 2-4**
  - [ ] Analyze usage patterns
  - [ ] Optimize cache strategy
  - [ ] A/B test install prompts
  - [ ] Improve based on data

- [ ] **Ongoing**
  - [ ] Monthly performance audits
  - [ ] Service worker updates
  - [ ] Feature enhancements
  - [ ] User feedback integration

## Rollback Plan

If critical issues occur:

1. **Disable Service Worker**
   - Remove service worker registration
   - Deploy hotfix build
   - Clear user caches (if possible)

2. **Disable Push Notifications**
   - Remove subscription code
   - Unsubscribe users via backend
   - Deploy update

3. **Full Rollback**
   - Restore previous build
   - Clear CDN cache
   - Communicate to users

## Success Metrics

Track these KPIs:

- [ ] **Installation**
  - [ ] Install prompt impressions
  - [ ] Install prompt acceptance rate
  - [ ] Total PWA installs
  - [ ] Active PWA users

- [ ] **Engagement**
  - [ ] Offline usage sessions
  - [ ] Push notification opt-in rate
  - [ ] Biometric auth adoption
  - [ ] Session duration (PWA vs browser)

- [ ] **Performance**
  - [ ] First Contentful Paint (FCP)
  - [ ] Largest Contentful Paint (LCP)
  - [ ] Time to Interactive (TTI)
  - [ ] Service worker activation time

- [ ] **Retention**
  - [ ] Day 1 retention
  - [ ] Day 7 retention
  - [ ] Day 30 retention
  - [ ] PWA uninstall rate

## Support Resources

- **Documentation:** `PWA_IMPLEMENTATION.md`
- **Quick Start:** `PWA_QUICK_START.md`
- **Icons Guide:** `src/assets/icons/README.md`

## Sign-Off

- [ ] Development team signed off
- [ ] QA team signed off
- [ ] Product owner signed off
- [ ] Security team signed off (if applicable)
- [ ] DevOps team signed off

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

---

**Notes:**

_Add any deployment-specific notes or considerations here_
